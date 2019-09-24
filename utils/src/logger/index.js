/* eslint-disable no-underscore-dangle */
const cls = require('cls-hooked');
const bunyan = require('bunyan');
const { logging, constants } = require('../../config');
const { maskPayload } = require('../obfuscate');

const tracking = cls.createNamespace(constants.TRACKING_NAMESPACE);

if (!global.__stack) {
  Object.defineProperty(global, '__stack', {
    get() {
      const orig = Error.prepareStackTrace;
      Error.prepareStackTrace = (_, stack) => stack;
      const err = new Error();
      Error.captureStackTrace(err, this);
      const { stack } = err;
      Error.prepareStackTrace = orig;
      return stack;
    },
  });
}

if (!global.__info) {
  Object.defineProperty(global, '__info', {
    get() {
      let stack = global.__stack[4];
      if (!stack) {
        // eslint-disable-next-line prefer-destructuring
        stack = global.__stack[3];
      }
      return {
        line: stack.getLineNumber(),
        file: stack.getFileName(),
        function: stack.getFunctionName(),
      };
    },
  });
}

function requestSerializer(req) {
  if (!req || !req.connection) {
    return req;
  }
  return {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: maskPayload(req.body),
    params: req.params,
  };
}

function responseSerializer(res) {
  if (!res) {
    return res;
  }
  return {
    statusCode: res.statusCode,
    statusMessage: res.statusMessage,
    headers: res._header,
  };
}

const logInstance = bunyan.createLogger({
  name: 'CORE',
  level: logging.level,
  serializers: {
    req: requestSerializer,
    res: responseSerializer,
  },
});

class Logger {
  static debug(obj) {
    if (bunyan.DEBUG >= logInstance._level) {
      const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
      if (!ns) {
        logInstance.debug(obj);
        return;
      }
      const instance = ns.get('logger') || logInstance;
      instance.debug(obj);
    }
  }

  static info(obj) {
    if (bunyan.INFO >= logInstance._level) {
      const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
      if (!ns) {
        logInstance.info(obj);
        return;
      }
      const instance = ns.get('logger') || logInstance;
      instance.info(obj);
    }
  }

  static warn(obj) {
    if (bunyan.WARN >= logInstance._level) {
      const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
      if (!ns) {
        logInstance.warn(obj);
        return;
      }
      const instance = ns.get('logger') || logInstance;
      instance.warn(obj);
    }
  }

  static error(obj) {
    if (bunyan.ERROR >= logInstance._level) {
      const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
      if (!ns) {
        logInstance.error(
          Object.assign(obj, {
            line: global.__info.line,
            function: global.__info.function,
            file: global.__info.file,
          })
        );
        return;
      }
      const instance = ns.get('logger') || logInstance;
      instance.error(
        Object.assign(obj, {
          line: global.__info.line,
          function: global.__info.function,
          file: global.__info.file,
          req: ns.get('request'),
        })
      );
    }
  }

  static fatal(obj) {
    if (bunyan.FATAL >= logInstance._level) {
      const ns = cls.getNamespace(constants.TRACKING_NAMESPACE);
      if (!ns) {
        logInstance.fatal(
          Object.assign(obj, {
            line: global.__info.line,
            function: global.__info.function,
            file: global.__info.file,
          })
        );
        return;
      }
      const instance = ns.get('logger') || logInstance;
      instance.fatal(
        Object.assign(obj, {
          line: global.__info.line,
          function: global.__info.function,
          file: global.__info.file,
        })
      );
    }
  }

  static invocation(obj) {
    return this.debug(obj);
  }
}

module.exports = {
  logger: Logger,
  logInstance,
  tracking,
};
