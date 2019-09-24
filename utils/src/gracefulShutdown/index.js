const stoppable = require('stoppable');
const { logger } = require('../logger');

const IS_TEST_ENV = process.env.NODE_ENV === 'TEST'; // eslint-disable-line no-process-env

function signalHandler(server) {
  if (IS_TEST_ENV) {
    logger.info({ message: 'SIGINT/SIGTERM received. Stopping immediately!' });
    setTimeout(process.exit.bind(process), 50);
  } else {
    logger.info({ message: 'SIGINT/SIGTERM received. Stopping gracefully...' });
    server.stop();
  }
}

function gracefulShutdown(server) {
  const stoppableServer = stoppable(server);
  const handleSignal = signalHandler.bind(null, stoppableServer);
  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);
  return true;
}

module.exports = gracefulShutdown;
