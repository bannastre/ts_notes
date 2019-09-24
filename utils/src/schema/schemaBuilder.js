const Ajv = require('ajv');
const _ = require('lodash');
const valueValidator = require('validator');

const { logger } = require('../logger');
const baseSchema = require('./baseSchema.json');

// createRequestSchemaID creates a regexp for the method/path
// combination to allow matching urls -> schemas
function createRequestSchemaID(basePath, path, method) {
  logger.invocation({ args: { basePath, path, method } });

  // need to check if path is base path to prevent double slashes
  const schemaID = `^${method.toUpperCase()}${basePath}${
    path === '/' ? '' : path
  }/?(\\?+.*)?$`;
  return schemaID
    .replace(/{/g, '(?<') // replace opening '{' with first part of capture group for path parameters
    .replace(/}/g, '>[^/]+/?)'); // replace closing '}' with closing part of capture group for path parameters
}

// createResponseSchemaID creates a regexp for the method/path combination
// to allow matching urls + response codes -> schemas
function createResponseSchemaID(basePath, path, method, responseCode) {
  logger.invocation({ args: { basePath, path, method } });

  // need to check if path is base path to prevent double slashes
  const schemaID = `^${responseCode}${method.toUpperCase()}${basePath}${
    path === '/' ? '' : path
  }/?(\\?+.*)?$`;
  return schemaID
    .replace(/{/g, '(?<') // replace opening '{' with first part of capture group for path parameters
    .replace(/}/g, '>[^/]+/?)'); // replace closing '}' with closing part of capture group for path parameters
}

// compileDefinitions takes the swagger and loops through the definitions adding a schema for each
function compileDefinitions(ajv, swagger) {
  logger.invocation({ args: { ajv, swagger } });
  if (!swagger.definitions) {
    return;
  }
  Object.keys(swagger.definitions).forEach(key => {
    ajv.addSchema(
      Object.assign(
        {
          $id: `/definitions/${key}`,
          type: 'object',
        },
        swagger.definitions[key]
      )
    );
  });
}

// handleBodyEntry appends an entry to the schemaObject for a body parameter.
function handleBodyEntry(schemaObject, field) {
  logger.invocation({ args: { schemaObject, field } });

  const localSchema = _.cloneDeep(schemaObject);

  if (!localSchema.required.includes('body')) {
    localSchema.required.push('body');
  }

  // body is already set by a ref. ignore new data to prevent override.
  if (localSchema.properties.body.$ref) {
    return localSchema;
  }

  // body is already set by an array ref. ignore new data to prevent override.
  if (
    localSchema.properties.body.items &&
    localSchema.properties.body.items.$ref
  ) {
    return localSchema;
  }

  // body is an array, we need to override whole block
  if (field.schema.type === 'array') {
    localSchema.properties.body = field.schema;
    return localSchema;
  }

  if (field.schema && field.schema.$ref) {
    localSchema.properties.body = {
      $ref: field.schema.$ref.substr(1, field.schema.$ref.length - 1),
    };
  } else if (field.schema && field.schema.items && field.schema.items.$ref) {
    localSchema.properties.body.items = {};
    localSchema.properties.body.items.$ref = field.schema.items.$ref.substr(
      1,
      field.schema.items.$ref.length - 1
    );
  } else {
    const currentRequired = localSchema.properties.body.required;
    localSchema.properties.body.required = field.schema.required
      ? currentRequired.concat(field.schema.required)
      : [];
    localSchema.properties.body.properties = Object.assign(
      localSchema.properties.body.properties,
      field.schema.properties
    );
  }
  return localSchema;
}

// handleGenericEntry creates functions to deal with headers/query/path params
function handleGenericEntry(type) {
  return function handleEntry(schemaObject, field) {
    logger.invocation({ args: { schemaObject, field } });

    const localSchema = _.cloneDeep(schemaObject);

    if (!localSchema.required.includes(type)) {
      localSchema.required.push(type);
    }
    if (field.required) {
      localSchema.properties[type].required.push(field.name);
    }
    const fields = _.cloneDeep(field);
    delete fields.required;
    localSchema.properties[type].properties[field.name] = fields;
    return localSchema;
  };
}

// creates methods for headers/query/path
const handleHeaderEntry = handleGenericEntry('headers');
const handleQueryEntry = handleGenericEntry('query');
const handlePathEntry = handleGenericEntry('path');

// compileSchema loops through swagger file routes and creates schemas for each route.
function compileRequestSchema(ajv, swagger) {
  logger.invocation({ args: { ajv, swagger } });
  Object.keys(swagger.paths).forEach(path => {
    Object.keys(swagger.paths[path]).forEach(method => {
      const schemaFields = swagger.paths[path][method].parameters || [];

      let schemaObject = _.cloneDeep(baseSchema);
      schemaFields.forEach(field => {
        switch (field.in) {
          case 'body':
            schemaObject = handleBodyEntry(schemaObject, field);
            break;
          case 'header':
            schemaObject = handleHeaderEntry(schemaObject, field);
            break;
          case 'query':
            schemaObject = handleQueryEntry(schemaObject, field);
            break;
          case 'path':
            schemaObject = handlePathEntry(schemaObject, field);
            break;
          default:
            break;
        }
      });
      ajv.addSchema(
        Object.assign(
          { $id: createRequestSchemaID(swagger.basePath, path, method) },
          schemaObject
        )
      );
    });
  });
}

// compileSchema loops through swagger file routes
//  and creates schemas for each routes response code.
function compileResponseSchema(ajv, swagger) {
  logger.invocation({ args: { ajv, swagger } });
  Object.keys(swagger.paths).forEach(path => {
    Object.keys(swagger.paths[path]).forEach(method => {
      const responseCodes = swagger.paths[path][method].responses || {};
      Object.keys(responseCodes).forEach(responseCode => {
        const schemaObject = responseCodes[responseCode].schema;
        if (schemaObject && schemaObject.$ref) {
          schemaObject.$ref = schemaObject.$ref.substr(
            1,
            schemaObject.$ref.length - 1
          );
        } else if (
          schemaObject &&
          schemaObject.items &&
          schemaObject.items.$ref
        ) {
          schemaObject.items.$ref = schemaObject.items.$ref.substr(
            1,
            schemaObject.items.$ref.length - 1
          );
        }
        ajv.addSchema(
          Object.assign(
            {
              $id: createResponseSchemaID(
                swagger.basePath,
                path,
                method,
                responseCode
              ),
            },
            schemaObject
          )
        );
      });
    });
  });
}

// buildSchemaValidator builds schema from swagger file
function buildSchemaValidator(swagger) {
  logger.invocation({ args: { swagger } });
  try {
    const ajv = new Ajv({
      allErrors: true,
      formats: {
        int32: valueValidator.isInt,
        int64: valueValidator.isInt,
        url: valueValidator.isURL,
      },
      coerceTypes: true,
    });
    compileDefinitions(ajv, swagger);
    compileRequestSchema(ajv, swagger);
    compileResponseSchema(ajv, swagger);
    return ajv;
  } catch (err) {
    // if we can't parse schemas, fail fast.
    logger.fatal({ err, message: 'FAILED TO PARSE SWAGGER FILE. EXITING...' });
    return process.exit(1); // eslint-disable-line no-process-exit
  }
}

module.exports = {
  buildSchemaValidator,
};
