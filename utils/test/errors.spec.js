const chai = require('chai');

chai.should();

const errors = require('../src/errors');

describe('Errors', () => {
  describe('error classes', () => {
    context('all exports should be an error subclass', () => {
      Object.keys(errors).forEach(error => {
        it(`${error} should be a subclass of error`, () => {
          const instance = new errors[error]();
          instance.should.be.instanceof(Error);
        });
      });
    });

    context('all exports should have a message and detail field', () => {
      Object.keys(errors).forEach(error => {
        it(`${error} should have a message and detail field`, () => {
          const instance = new errors[error]();
          instance.should.include.keys('message', 'details');
        });
      });
    });

    context('http errors and subclasses should have status code fields', () => {
      Object.keys(errors).forEach(error => {
        const instance = new errors[error]();
        if (instance instanceof errors.HTTPError) {
          it(`${error} should have a status code`, () => {
            instance.should.include.keys('message', 'details', 'statusCode');
          });
        }
      });
    });
  });
});
