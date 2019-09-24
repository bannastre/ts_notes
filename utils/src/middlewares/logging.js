const morgan = require('morgan');

const logging = () => {
  const logFormat =
    ':date[iso] :method :url :status :res[content-length] - :response-time ms';
  // TODO: Configure logging via LogStream for production deployment
  const logOptions = {};
  return morgan(logFormat, logOptions);
};

module.exports = { logging };
