/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable no-underscore-dangle */
const chai = require('chai');
const EventEmitter = require('events');
const cls = require('cls-hooked');

const should = chai.should();

const {
  parseRequest,
  schemaValidator,
  trackingInit,
  requestInit,
  logsClose,
} = require('../src/middlewares');

const { constants } = require('../config');

const { STRING, UUID_STRING, UUID_STRING_NUM_START, FLOAT } = {
  STRING: 'tom',
  FLOAT: '333.0',
  UUID_STRING: 'cf831484-4bdb-4673-b1c9-b649890c9527',
  UUID_STRING_NUM_START: '1438d41e-bd48-431e-bf12-0072c223beab',
};

class Request extends EventEmitter {
  constructor() {
    super();
    this.headers = {
      'x-correlation-id': '123', // eslint-disable-line sonarjs/no-duplicate-string
      'content-type': 'application/json',
      'transfer-encoding': 'unknown',
      integer: '111',
      float: FLOAT,
      string: STRING,
      uuidString: UUID_STRING,
      uuidStringNumStart: UUID_STRING_NUM_START,
    };
    this.query = {
      integer: '111',
      float: FLOAT,
      string: STRING,
      uuidString: UUID_STRING,
      uuidStringNumStart: UUID_STRING_NUM_START,
    };
    this.connection = {
      remoteAddress: 'PC1234567890:0',
      remotePort: '4697',
    };
    this.method = 'POST';
    this.originalUrl = '/gettingstarted/clients/antonio/notifications';
    this._parsedUrl = {
      pathname: '/gettingstarted/clients/antonio/notifications',
    };
    this.body = JSON.stringify({ name: 'tom' });
  }

  sendData() {
    this.emit('data', this.body);
    this.emit('end');
  }
}

class Response {
  constructor() {
    this.statusCode = null;
    this.jsonField = null;
    this.responseHeaders = {};
  }

  set(key, value) {
    this.responseHeaders[key] = value;
    return this;
  }

  status(x) {
    this.statusCode = x;
    return this;
  }

  json(x) {
    this.jsonField = x;
    return this;
  }
}

describe('Middlewares', () => {
  describe('parseRequest', () => {
    beforeEach(() => {
      this.middleware = parseRequest();
      this.request = new Request();
    });

    it('should return a fn', () => {
      this.middleware.should.be.a('function');
    });
    it('middleware should not change any strings in request queries', done => {
      setTimeout(() => this.request.sendData(), 20);
      this.middleware(this.request, {}, () => {
        const { string, uuidString, uuidStringNumStart } = this.request.query;
        string.should.be.a('string');
        string.should.equal(STRING);
        uuidString.should.be.a('string');
        uuidString.should.equal(UUID_STRING);
        uuidStringNumStart.should.be.a('string');
        uuidStringNumStart.should.equal(UUID_STRING_NUM_START);
        done();
      });
    });
    it('middleware should not change any strings in request headers', done => {
      setTimeout(() => this.request.sendData(), 20);
      this.middleware(this.request, {}, () => {
        const { string, uuidString, uuidStringNumStart } = this.request.headers;
        string.should.be.a('string');
        string.should.equal(STRING);
        uuidString.should.be.a('string');
        uuidString.should.equal(UUID_STRING);
        uuidStringNumStart.should.be.a('string');
        uuidStringNumStart.should.equal(UUID_STRING_NUM_START);
        done();
      });
    });
    it('middleware should not fail if no query', done => {
      delete this.request.query;
      setTimeout(() => this.request.sendData(), 20);
      this.middleware(this.request, {}, err => {
        // eslint-disable-line promise/prefer-await-to-callbacks
        should.not.exist(err);
        done();
      });
    });
    it('middleware should set body to null if invalid body', done => {
      this.request.body = '{invalidJson';
      setTimeout(() => this.request.sendData(), 20);
      this.middleware(this.request, {}, err => {
        // eslint-disable-line promise/prefer-await-to-callbacks
        should.not.exist(err);
        should.not.exist(this.request.body);
        done();
      });
    });
  });

  describe('trackingInit', () => {
    beforeEach(() => {
      this.tracking = trackingInit();
    });
    it('should return a function', () => {
      // eslint-disable-line sonarjs/no-duplicate-string
      this.tracking.should.be.a('function');
    });
    it('should bind tracking to namespace', done => {
      const context = function next() {
        const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
        ns.active._ns_name.should.equal('tracking');
        done();
      };
      this.tracking({}, {}, context);
    });
  });

  describe('requestInit', () => {
    beforeEach(() => {
      this.requestInit = requestInit();
      this.tracking = trackingInit();
    });
    it('should return a function', () => {
      this.requestInit.should.be.a('function');
    });
    it('should set gen a x-correlation id if not present', done => {
      const request = new Request();
      const response = new Response();

      delete request.headers['x-correlation-id'];
      this.tracking(request, response, () =>
        this.requestInit(request, response, () => {
          response.responseHeaders['x-correlation-id'].should.be.a('string');
          done();
        })
      );
    });
    it('should set response headers', done => {
      const request = new Request();
      const response = new Response();
      this.tracking(request, response, () =>
        this.requestInit(request, response, () => {
          // eslint-disable-line sonarjs/no-identical-functions
          response.responseHeaders['x-correlation-id'].should.be.a('string');
          done();
        })
      );
    });
    it('should set tracking items', done => {
      const request = new Request();
      const response = new Response();
      this.tracking(request, response, () =>
        this.requestInit(request, response, () => {
          const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
          ns.get('correlationID').should.be.a('string');
          ns.get('executionID').should.be.a('string');
          ns.get('logger').should.be.a('object');
          done();
        })
      );
    });
  });
  describe('logsClose', () => {
    beforeEach(() => {
      this.closeLogs = logsClose();
    });
    it('should return a function', () => {
      this.closeLogs.should.be.a('function');
    });
    it('should not error', done => {
      const request = new Request();
      const response = new Response();
      this.closeLogs(request, response, err => {
        // eslint-disable-line promise/prefer-await-to-callbacks
        should.not.exist(err);
        done();
      });
    });
  });
  describe('schemaValidator', () => {
    it('should return a function', () => {
      schemaValidator(`${__dirname}/assets/validYamlSwagger.yaml`).should.be.a(
        'function'
      );
    });
  });

  describe('trackingInit', () => {
    // eslint-disable-line sonarjs/no-identical-functions
    beforeEach(() => {
      this.tracking = trackingInit();
    });
    it('should return a function', () => {
      this.tracking.should.be.a('function');
    });
    it('should bind tracking to namespace', done => {
      // eslint-disable-line sonarjs/no-identical-functions
      const context = function next() {
        // eslint-disable-line sonarjs/no-identical-functions
        const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
        ns.active._ns_name.should.equal('tracking');
        done();
      };
      this.tracking({}, {}, context);
    });
  });

  describe('requestInit', () => {
    beforeEach(() => {
      this.requestInit = requestInit();
      this.tracking = trackingInit();
    });
    it('should return a function', () => {
      this.requestInit.should.be.a('function');
    });
    it('should set response headers', done => {
      // eslint-disable-line sonarjs/no-identical-functions
      const request = new Request();
      const response = new Response();
      this.tracking(request, response, () =>
        this.requestInit(request, response, () => {
          // eslint-disable-line sonarjs/no-identical-functions
          response.responseHeaders['x-correlation-id'].should.be.a('string');
          done();
        })
      );
    });
    it('should set tracking items', done => {
      // eslint-disable-line sonarjs/no-identical-functions
      const request = new Request();
      const response = new Response();
      this.tracking(request, response, () =>
        this.requestInit(request, response, () => {
          // eslint-disable-line sonarjs/no-identical-functions
          const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
          ns.get('correlationID').should.be.a('string');
          ns.get('executionID').should.be.a('string');
          ns.get('logger').should.be.a('object');
          done();
        })
      );
    });
  });
  describe('logsClose', () => {
    // eslint-disable-line sonarjs/no-identical-functions
    beforeEach(() => {
      this.closeLogs = logsClose();
    });
    it('should return a function', () => {
      this.closeLogs.should.be.a('function');
    });
    it('should not error', done => {
      // eslint-disable-line sonarjs/no-identical-functions
      const request = new Request();
      const response = new Response();
      this.closeLogs(request, response, err => {
        // eslint-disable-line promise/prefer-await-to-callbacks
        should.not.exist(err);
        done();
      });
    });
  });
});
