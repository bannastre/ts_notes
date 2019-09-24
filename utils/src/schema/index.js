/* eslint-disable unicorn/no-unsafe-regex */
/* eslint-disable no-underscore-dangle */
const fs = require('fs');
const YAML = require('yamljs');

const load = require;

const {
  InvalidParameterError,
  NotFoundError,
  ServerError,
} = require('../errors');
const { logger } = require('../logger');

const schemaBuilder = require('./schemaBuilder');

// parses a yaml file to json
function parseYAMLToJSON(yamlFilePath) {
  try {
    const schemaBuffer = fs.readFileSync(yamlFilePath);
    const schemaString = schemaBuffer.toString();
    return YAML.parse(schemaString);
  } catch (err) {
    logger.fatal({ message: 'unable to parse .yaml swagger file' });
    return process.exit(1); // eslint-disable-line no-process-exit
  }
}

// loads + parses json/yaml files
function loadSchema(schemaPath) {
  if (schemaPath.match(/\.yaml$/)) {
    return parseYAMLToJSON(schemaPath);
  }
  if (schemaPath.match(/\.json$/)) {
    return load(schemaPath);
  }
  logger.fatal({ message: 'schema file must be either .yaml or .json' });
  return process.exit(1); // eslint-disable-line no-process-exit
}

class Schema {
  constructor(schemaPath) {
    if (!schemaPath) {
      logger.error({ message: 'No Schema Provided For Server' });
      throw new ServerError('No Schema Provided For Server');
    }
    this.schema = loadSchema(schemaPath);
    this.validator = schemaBuilder.buildSchemaValidator(this.schema);
  }

  // _matchRoute matches a url/method pair against the schemas loaded into the validator
  _matchRoute(url, method, statusCode = '') {
    const schemas = this.validator._schemas;
    const type = `${statusCode || ''}${method}${url}`;
    const keys = Object.keys(schemas);
    const schemaName = keys.find(key => type.match(key));
    if (!schemaName) {
      return null;
    }
    try {
      return this.validator.getSchema(schemaName);
    } catch (err) {
      logger.fatal({ message: `ERROR PARSING SCHEMA: ${err.message}` });
      return null;
    }
  }

  // _extractPathParams compares current route against schema route to extract path parameters
  static _extractPathParams(url, method, match) {
    const type = `${method}${url}`;
    const result = type.match(match);

    if (!result || !result.groups) {
      return {};
    }

    Object.keys(result.groups).forEach(key => {
      if (
        typeof result.groups[key] === 'string' &&
        (/^[+-]?\d+(\.\d+)?$/.test(result.groups[key]) ||
          /^\d+$/.test(result.groups[key]))
      ) {
        // eslint-disable-line unicorn/no-unsafe-regex
        result.groups[key] = parseFloat(result.groups[key], 10);
      }
    });
    return result.groups;
  }

  // validate exposes an express middleware which validates request for current path.
  validate(req, res, next) {
    logger.invocation({ req });
    // res.status is undefined on inbound requests and defined on outbound requests
    const schema = this._matchRoute(
      req.originalUrl,
      req.method,
      res.statusCode
    );
    if (!schema) {
      // assume response validation
      if (res.statusCode) {
        logger.info({
          message: `Schema Not Found: ${req.originalUrl}:${req.method}`,
        });
        const error = new ServerError(
          `No Swagger Found for ${res.statusCode}:${req.originalUrl}:${req.method}`
        );
        return next ? next(error) : error;
      }
      logger.info({
        message: `Schema Not Found: ${req.originalUrl}:${req.method}`,
      });
      const error = new NotFoundError(
        `Cannot ${req.method} ${req.originalUrl}`
      );
      return next ? next(error) : error;
    }
    let valid;
    if (!res.statusCode) {
      // inbound request
      const path = Schema._extractPathParams(
        req._parsedUrl.pathname,
        req.method,
        schema.schema.$id
      );
      valid = schema({
        body: req.body,
        headers: req.headers,
        query: req.query,
        path,
      });
    } else {
      // outbound request
      valid = schema(res.body);
    }
    if (!valid) {
      logger.error({
        message: `body validation failed for ${req.originalUrl}:${req.method}`,
        validationErrors: JSON.stringify(schema.errors),
      });
      const error = new InvalidParameterError('See Errors', schema.errors);
      return next ? next(error) : error;
    }
    return next ? next() : null;
  }
}

module.exports = Schema;
