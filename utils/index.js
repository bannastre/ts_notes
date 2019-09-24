/* eslint-disable node/no-unsupported-features/es-syntax */
const errors = require('./src/errors');
const { logger, logInstance, tracking } = require('./src/logger');
const middlewares = require('./src/middlewares');
const gracefulShutdown = require('./src/gracefulShutdown');
const { maskPayload } = require('./src/obfuscate');
const Schema = require('./src/schema');
const services = require('./src/services');

// eslint-disable-next-line sonarjs/cognitive-complexity
function defaultErrorHandler(
  err,
  eventObject,
  context,
  ThrowErrorType = undefined
) {
  if (err instanceof errors.BaseError) return err;

  let eventMessage = eventObject;
  let code = 'DEF-001';

  if (typeof eventObject === 'object') {
    eventMessage = eventObject.message;
    code = eventObject.eventCode;
  }

  try {
    const error = {
      name: err.name,
      message: err.message,
    };

    if (err.name === 'StatusCodeError') {
      error.statusCode = err.statusCode;
      if (err.details) {
        error.details = err.details;
      }
      if (err.error) {
        error.details = err.error;
      }
      if (err.options) {
        if (err.options.method) {
          error.method = err.method;
        }
        if (err.options.url) {
          error.url = err.url;
        }
        if (err.options.headers) {
          error.headers = err.headers;
        }
        if (err.options.qs) {
          error.qs = err.options.qs;
        }
        if (err.options.body) {
          error.body = maskPayload(err.options.body);
        }
      }
    }

    if (context) {
      error.context = context;
    }

    logger.error({ error, message: `${code}: ${eventMessage}` });

    let newError = new errors.ServerError(eventMessage);

    if (ThrowErrorType) {
      newError = new ThrowErrorType(eventMessage);
    }

    if (err.name === 'StatusCodeError' && !ThrowErrorType) {
      switch (err.statusCode) {
        case 400:
          newError = new errors.InvalidParameterError(eventMessage);
          Object.assign(newError, err.error);
          break;
        case 401:
          newError = new errors.UnauthorizedError(eventMessage);
          break;
        case 403:
          newError = new errors.ForbiddenError(eventMessage);
          break;
        case 404:
          newError = new errors.NotFoundError(eventMessage);
          break;
        case 405:
          newError = new errors.MethodNotAllowedError(eventMessage);
          break;
        case 409:
          newError = new errors.DuplicateError(eventMessage);
          break;
        case 410:
          newError = new errors.GoneError(eventMessage);
          break;
        case 429:
          newError = new errors.TooManyAttemptsError(eventMessage);
          break;
        default:
          newError = new errors.ServerError(eventMessage);
          break;
      }
    }
    return newError;
  } catch (err_) {
    // eslint-disable-next-line no-console
    console.log({
      message: `Unexpected error during default error handler: ${err_}`,
    });
    return new errors.ServerError(eventMessage);
  }
}

module.exports = {
  errors,
  defaultErrorHandler,
  middlewares,
  middleware: middlewares,
  gracefulShutdown,
  logger,
  logInstance,
  tracking,
  Schema,
  services,
};
