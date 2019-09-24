const chai = require('chai');
const http = require('http');

chai.should();

const gracefulShutdown = require('../src/gracefulShutdown');

describe('Graceful Shutdown', () => {
  describe('exports', () => {
    context('all exports should be an error subclass', () => {
      const server = http.createServer(() => {});
      gracefulShutdown(server).should.equal(true);
    });
    context('it should trap SIGINT', () => {
      const server = http.createServer(() => {});
      gracefulShutdown(server).should.equal(true);
      process.emit('SIGINT');
    });
    context('it should trap SIGTERM', () => {
      const server = http.createServer(() => {});
      gracefulShutdown(server).should.equal(true);
      process.emit('SIGTERM');
    });
  });
});
