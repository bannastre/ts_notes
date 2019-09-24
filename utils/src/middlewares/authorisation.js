/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable promise/prefer-await-to-callbacks */
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');

const checkJwt = (options = {}, defaultErrorHandler, throwError) => {
  if (
    !Object.prototype.hasOwnProperty.call(options, 'jwksUri') ||
    !Object.prototype.hasOwnProperty.call(options, 'authorisationAudience') ||
    !Object.prototype.hasOwnProperty.call(options, 'issuer')
  ) {
    throw new Error(
      'Incorrect options provided to checkJwt. jwksUri, authorisationAudience and issuer should all have a value'
    );
  }

  const middleware = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 20,
      jwksUri: options.jwksUri,
    }),
    audience: options.authorisationAudience,
    issuer: options.issuer,
    algorithms: ['RS256'],
  });

  return (req, res, next) =>
    middleware(req, res, err => {
      req.scope = {
        correlationId: req.headers['x-correlation-id']
          ? req.headers['x-correlation-id'].toString()
          : '',
        personId: req.headers['x-person-id']
          ? req.headers['x-person-id'].toString()
          : '',
        tenant: req.tenant ? req.tenant : null,
        user: req.user ? req.user : null,
        authorization:
          req.headers && req.headers.authorization
            ? req.headers.authorization
            : '',
      };

      if (err instanceof Error) {
        errorEvent = {
          code: 'ONB-AUTH',
          message: err.message,
        };
        err = defaultErrorHandler(err, errorEvent, null, throwError);
      }
      next(err);
    });
};

const checkRole = (roles, options) => {
  return jwtAuthz(roles, { ...options, checkAllScopes: true });
};

module.exports = { checkJwt, checkRole };
