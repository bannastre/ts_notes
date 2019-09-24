/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable no-underscore-dangle */
/* eslint-disable node/no-unpublished-require */
const chai = require('chai');
const Ajv = require('ajv');
const fs = require('fs');
const YAML = require('yamljs');
const {
  InvalidParameterError,
  ServerError,
  NotFoundError,
} = require('../src/errors');

const should = chai.should();

const schemaBuilder = require('../src/schema/schemaBuilder');
const Schema = require('../src/schema');

function parseYAMLToJSON(yamlFilePath) {
  const schemaBuffer = fs.readFileSync(yamlFilePath);
  const schemaString = schemaBuffer.toString();
  return YAML.parse(schemaString);
}

const validRequest = {
  body: {},
  headers: {},
  query: {
    pattern: 'hello, world',
    enum: 'one',
    minMax: 20,
    exclusiveMinMax: 19,
    multipleOf: 3,
    length: 'four',
    minMaxItems: [1, 2, 3, 4],
    uniqueItems: [1, 2, 3],
    minMaxProperties: {
      a: 1,
      b: 2,
    },
  },
  path: {},
};

const invalidRequest = {
  body: {},
  headers: {},
  query: {
    pattern: 'goodbye, world',
    enum: 'not an enum',
    minMax: 500,
    exclusiveMinMax: 20,
    multipleOf: 2,
    length: 'wronglength',
    minMaxItems: [1, 2, 3, 4, 5, 1, 5, 2],
    uniqueItems: [1, 2, 3, 2, 2],
    minMaxProperties: {},
  },
  path: {},
};

describe('Schema', () => {
  describe('schemaBuilder', () => {
    before(() => {
      this.validYamlFile = parseYAMLToJSON(
        `${__dirname}/assets/validYamlSwagger.yaml`
      );
      this.invalidYamlFile = parseYAMLToJSON(
        `${__dirname}/assets/invalidYamlSwagger.yaml`
      );
    });

    context('Valid File', () => {
      it('should return a valid ajv instance', () => {
        process.env.RESPONSE_VALIDATION = true; // eslint-disable-line no-process-env
        const schemaValidator = schemaBuilder.buildSchemaValidator(
          this.validYamlFile
        );
        schemaValidator.should.be.instanceOf(Ajv);
      });
    });
  });
  describe('Schema', () => {
    before(() => {
      this.validYamlFilePath = `${__dirname}/assets/validYamlSwagger.yaml`;
      this.validJSONFilePath = `${__dirname}/assets/validJSONSwagger.json`;

      this.invalidYamlFilePath = `${__dirname}/assets/invalidYamlSwagger.yaml`;
      this.invalidJSONFilePath = `${__dirname}/assets/invalidJSONSwagger.json`;
      this.invalidFilePath = `${__dirname}/assets/nofile.yaml`;
      this.invalidFile = `${__dirname}/assets/nofile`;
      this.runtimeInvalidSwagger = `${__dirname}/assets/runtimeInvalidSwagger.yaml`;
    });

    describe('Constructor', () => {
      context('valid file', () => {
        it('should compile from a yaml file', () => {
          const schema = new Schema(this.validYamlFilePath);
          schema.validator.should.be.instanceOf(Ajv);
        });

        it('should compile from a json file', () => {
          const schema = new Schema(this.validJSONFilePath);
          schema.validator.should.be.instanceOf(Ajv);
        });

        it('should throw an error if no path given', () => {
          (() => new Schema()).should.throw(ServerError);
        });
      });
    });
    describe('#_matchRoute', () => {
      /* lint does not like mochas .to.be.null syntax */
      /* eslint-disable no-unused-expressions */
      beforeEach(() => {
        this.schema = new Schema(this.validYamlFilePath);
      });
      it('should match basepath with no params', () => {
        this.schema._matchRoute('/gettingstarted', 'POST').should.not.be.null; // eslint-disable-line sonarjs/no-duplicate-string
      });
      it('should match basepath with no params', () => {
        this.schema._matchRoute('/gettingstarted/', 'POST').should.not.be.null;
      });
      it('should match path with no trailing slash', () => {
        this.schema._matchRoute('/gettingstarted/ping', 'GET').should.not.be
          .null;
      });
      it('should match path with query string', () => {
        this.schema._matchRoute('/gettingstarted/ping?id=1', 'GET').should.not
          .be.null;
      });
      it('should match path with multiple query string', () => {
        this.schema._matchRoute('/gettingstarted/ping?id=1&name=tom', 'GET')
          .should.not.be.null;
      });
      it('should match basepath with trailing slash', () => {
        this.schema._matchRoute('/gettingstarted/ping/', 'GET').should.not.be
          .null;
      });
      it('should match a route with params', () => {
        this.schema._matchRoute('/gettingstarted/clients/1', 'POST').should.not
          .be.null; // eslint-disable-line sonarjs/no-duplicate-string
      });
      it('should match a route with params and trailing slash', () => {
        this.schema._matchRoute('/gettingstarted/clients/1/', 'POST').should.not
          .be.null;
      });
      it('should match a route with multiple character params and trailing slash', () => {
        this.schema._matchRoute('/gettingstarted/clients/122334/', 'POST')
          .should.not.be.null;
      });
      it('should match a route with multiple character params query string and trailing slash', () => {
        this.schema._matchRoute('/gettingstarted/clients/122334/?id=1', 'POST')
          .should.not.be.null;
      });
      it('should match a route with params and sub resource', () => {
        this.schema._matchRoute(
          '/gettingstarted/clients/123/notifications',
          'POST'
        ).should.not.be.null;
      });
      it('should match a route with params and sub resource with trailing slash', () => {
        this.schema._matchRoute(
          '/gettingstarted/clients/123/notifications/',
          'POST'
        ).should.not.be.null;
      });
      it('should not match a route which does not exist', () => {
        should.not.exist(
          this.schema._matchRoute('/gettingstarted/clients/', 'POST')
        );
      });
      it('should not match a sub resource route which does not exist', () => {
        should.not.exist(
          this.schema._matchRoute('/gettingstarted/clients/1/data', 'POST')
        );
      });
      it('should not match a sub resource + id route which does not exist', () => {
        should.not.exist(
          this.schema._matchRoute('/gettingstarted/clients/1/data/1', 'POST')
        );
      });
      it('should not match a method which does not exist', () => {
        should.not.exist(
          this.schema._matchRoute('/gettingstarted/clients/1', 'GET')
        );
      });
      it('should not match a method + qs which does not exist', () => {
        should.not.exist(
          this.schema._matchRoute('/gettingstarted/clients/1?id=1', 'GET')
        );
      });
      /* eslint-enable no-unused-expressions */
    });

    describe('#_extractPathParams', () => {
      it('should return empty object if no path params', () => {
        const result = Schema._extractPathParams(
          '/gettingstarted',
          'POST',
          'POST/gettingstarted/?$'
        );
        result.should.eql({});
      });
      it('should return populated object if path params', () => {
        const result = Schema._extractPathParams(
          '/gettingstarted/clients/antonio',
          'POST',
          'POST/gettingstarted/clients/(?<clientID>[^/]+/?)/?$'
        ); // eslint-disable-line sonarjs/no-duplicate-string
        result.clientID.should.equal('antonio');
      });
      it('should parse ints in populated object if path params', () => {
        const result = Schema._extractPathParams(
          '/gettingstarted/clients/1',
          'POST',
          'POST/gettingstarted/clients/(?<clientID>[^/]+/?)/?$'
        );
        result.clientID.should.equal(1);
      });
      it('should not parse uuids that start with a number', () => {
        const result = Schema._extractPathParams(
          '/gettingstarted/clients/57a08950-6018-4172-83bb-9f78e0440401',
          'POST',
          'POST/gettingstarted/clients/(?<clientID>[^/]+/?)/?$'
        );
        result.clientID.should.equal('57a08950-6018-4172-83bb-9f78e0440401');
      });
    });

    describe('#validate', () => {
      before(() => {
        this.schema = new Schema(this.validYamlFilePath);
        this.invalidSchema = new Schema(this.runtimeInvalidSwagger);
      });
      it('should pass validation on valid request', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted',
            _parsedUrl: {
              pathname: '/gettingstarted',
            },
            ...validRequest,
          },
          {},
          done
        );
      });
      it('should coerce number data types in numbers', done => {
        const options = {
          method: 'POST',
          originalUrl: '/gettingstarted',
          _parsedUrl: { pathName: '/gettingstarted' },
          query: {
            pattern: 'hello, world',
            enum: 'one',
            minMax: '12',
            exclusiveMinMax: '11',
            multipleOf: '6',
            length: 'foo',
            minMaxItems: [1, 2, 3],
            uniqueItems: [],
            minMaxProperties: { a: 1 },
          },
          body: {},
          headers: {},
          path: {},
        };
        this.schema.validate(options, {}, done);
        options.query.minMax.should.be.a(Number);
        options.query.exclusiveMinMax.should.be.a(Number);
        options.query.multipleOf.should.be.a(Number);
      });
      it('should pass validation on valid request with query strings', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted?id=1',
            _parsedUrl: {
              pathname: '/gettingstarted',
            },
            ...validRequest,
          },
          {},
          done
        );
      });
      it('should error on request', () => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted/wrong', // eslint-disable-line sonarjs/no-duplicate-string
            body: {},
            headers: {},
            query: {},
            path: {},
          },
          {}
        );
      });
      it('should fail validation on invalid swagger', done => {
        this.invalidSchema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted',
            ...validRequest,
          },
          {},
          err => {
            // eslint-disable-line promise/prefer-await-to-callbacks
            err.should.be.instanceOf(NotFoundError);
            done();
          }
        );
      });
      it('should handle path param validation on valid request', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted/clients/tom',
            _parsedUrl: {
              pathname: '/gettingstarted/clients/tom',
            },
            ...validRequest,
          },
          {},
          done
        );
      });

      it('should fail validation on invalid request', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted',
            _parsedUrl: {
              pathname: '/gettingstarted',
            },
            ...invalidRequest,
          },
          {},
          err => {
            // eslint-disable-line promise/prefer-await-to-callbacks
            err.should.be.instanceOf(InvalidParameterError);
            err.errors.length.should.equal(9);
            done();
          }
        );
      });
      it('should fail validation on invalid path params', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted/clients/antonio',
            _parsedUrl: {
              pathname: '/gettingstarted/clients/antonio',
            },
            ...validRequest,
          },
          {},
          err => {
            // eslint-disable-line promise/prefer-await-to-callbacks
            err.should.be.instanceOf(InvalidParameterError);
            err.errors.length.should.equal(1);
            done();
          }
        );
      });
      it('should fail validation on unknown route', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted/wrong',
            body: {},
            headers: {},
            query: {},
            path: {},
          },
          {},
          err => {
            // eslint-disable-line promise/prefer-await-to-callbacks
            err.should.be.instanceOf(NotFoundError);
            done();
          }
        );
      });
      it('should validate response if status set', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted/clients/antonio/notifications',
            body: {},
            headers: {},
            query: {},
            path: {},
          },
          { statusCode: 200, body: { code: '100' } },
          done
        );
      });
      it('should fail validate response if status set and incorrect body', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted/clients/antonio/notifications',
            body: {},
            headers: {},
            query: {},
            path: {},
          },
          { statusCode: 200, body: { notcode: 100 } },
          err => {
            // eslint-disable-line promise/prefer-await-to-callbacks, sonarjs/no-identical-functions
            err.should.be.instanceOf(InvalidParameterError);
            err.errors.length.should.equal(1);
            done();
          }
        );
      });
      it('should fail to validate response if unknown path', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted/wrong',
            body: {},
            headers: {},
            query: {},
            path: {},
          },
          { statusCode: 200 },
          err => {
            // eslint-disable-line promise/prefer-await-to-callbacks
            err.should.be.instanceOf(ServerError);
            done();
          }
        );
      });
      it('should validate arrays', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted/dogs/wrong',
          },
          { statusCode: 200, body: [{ name: 'tom' }] },
          done
        );
      });
      it('should validate arrays and fail', done => {
        this.schema.validate(
          {
            method: 'POST',
            originalUrl: '/gettingstarted/dogs/wrong',
            body: {},
            headers: {},
            query: {},
            path: {},
          },
          { statusCode: 200, body: [{ nom: 'tom' }] },
          err => {
            // eslint-disable-line promise/prefer-await-to-callbacks
            err.should.be.instanceOf(InvalidParameterError);
            err.errors.length.should.equal(2);
            done();
          }
        );
      });
    });
  });
});
