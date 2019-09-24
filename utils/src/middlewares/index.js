const uuid = require('uuid/v4');
const cls = require('cls-hooked');
const bodyParser = require('body-parser');

const Schema = require('../schema');
const { BaseError } = require('../errors');
const { constants } = require('../../config');
const { logger, logInstance } = require('../logger');

const { checkJwt, checkRole } = require('./authorisation');
const { security } = require('./security');
const { logging } = require('./logging');

/**
 * Factory for middleware that parses any json/form data if the correct content type is set.
 *
 * @param {dict} options - Optional settings to pass through to a body parser middleware.
 *    @property {dict} json - Options expected by the "json" body parser, optional.
 *    @property {dict} urlencoded - Options expected by the "urlencoded" body parser, optional.
 * @returns {Function} A middleware function.
 */
function parseRequest(options = {}) {
  const jsonMiddleware = bodyParser.json(options.json || {});
  const formMiddleware = bodyParser.urlencoded({
    extended: true,
    ...(options.urlencoded || {}),
  });

  return function parser(req, res, next) {
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    jsonMiddleware(req, res, err => {
      if (err) {
        logger.info({ message: 'Unknown Error Parsing Body' });
        req.body = null;
      }
      formMiddleware(req, res, e => {
        if (e) {
          logger.info({ message: 'Unknown Error Parsing Body' });
          req.body = null;
        }
        next();
      });
    });
  };
}

// exposes schema validator
function schemaValidator(schemaName) {
  const schema = new Schema(schemaName);

  return function validate(req, res, next) {
    res.statusCode = null;
    return schema.validate(req, res, next);
  };
}

// handles errors by using http base error codes or default 500
function defaultErrorHandler() {
  return function errorHandler(err, req, res, next) {
    if (res.headersSent) {
      return next();
    }
    if (!(err instanceof BaseError)) {
      res.status(500).json({
        message: 'Internal Server Error',
        details: 'Unknown Error Occured',
      });
    } else {
      res.status(err.statusCode).json({
        message: err.message,
        details: err.details,
        errors: err.errors,
      });
    }
    return next();
  };
}

// binds cls request tracking to the current execution context
function trackingInit() {
  return function trackRequests(req, res, next) {
    const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
    ns.run(() => next());
  };
}

// sets logger for request context, w/ requestId headers
function requestInit() {
  return function startTracking(req, res, next) {
    const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
    const correlationID = req.headers[constants.CORRELATION_HEADER] || uuid();
    const entityID = req.headers['x-entity-id'];
    const personID = req.headers['x-person-id'];
    const executionID = uuid();
    ns.set('request', req);
    ns.set('correlationID', correlationID);
    ns.set('executionID', executionID);
    ns.set('entity', entityID);
    ns.set('person', personID);
    res.set('x-correlation-id', correlationID);
    const log = logInstance.child({
      correlationID,
      executionID,
      personID,
      entityID,
    });
    ns.set('logger', log);
    logger.debug({ req });
    next();
  };
}

function isHealthcheck(req) {
  if (!req.url || typeof req.url !== 'string') {
    return false;
  }
  return (
    req.url.endsWith('/healthcheck/ping') ||
    req.url.endsWith('/healthcheck/ready')
  );
}

// log exit code and body
function logsClose() {
  return function exitLogs(req, res, next) {
    logger.debug({ res });
    if (!isHealthcheck(req)) {
      logger.info({
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        remoteAddress: req.connection.remoteAddress,
        remotePort: req.connection.remotePort,
        type: 'API_CALL',
      });
    }
    next();
  };
}

module.exports = {
  parseRequest,
  schemaValidator,
  defaultErrorHandler,
  trackingInit,
  requestInit,
  logsClose,
  checkJwt,
  checkRole,
  security,
  logging,
};
