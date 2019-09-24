/* eslint-disable sonarjs/no-duplicate-string */
const chai = require('chai');
const { maskPayload } = require('../src/obfuscate');

chai.should();

describe('#maskPayload', () => {
  it('takes a null payload and returns it as-is', () => {
    const masked = maskPayload(null);
    chai.assert(masked === null, 'expected masked value to equal to null');
  });
  it('takes a non-object payload and returns it as-is', () => {
    // eslint-disable-line sonarjs/no-duplicate-string
    const masked = maskPayload('<xml><tag></tag></xml>');
    masked.should.eql('<xml><tag></tag></xml>');
  });
  it('takes a non-object payload and returns it as-is', () => {
    const masked = maskPayload(1234);
    masked.should.eql(1234);
  });
  it('takes a non-object payload and returns it as-is', () => {
    const masked = maskPayload(true);
    masked.should.eql(true);
  });
  it('takes an empty object payload and returns it as-is', () => {
    const masked = maskPayload({});
    masked.should.eql({});
  });
  it('takes an object payload without card number and returns it as-is', () => {
    const masked = maskPayload({ method: 'GET' });
    masked.should.eql({ method: 'GET' });
  });
  it('takes an object payload with card number and returns it masked', () => {
    const masked = maskPayload({ cardNumber: '1234567891234567890' });
    masked.cardNumber.should.eql('123456XXXXXXXXX7890');
  });
  it('takes an object payload with a deep card number and returns it masked', () => {
    const masked = maskPayload({
      payload: { cardNumber: '1234567891234567890' },
    });
    masked.payload.cardNumber.should.eql('123456XXXXXXXXX7890');
  });
  it('takes an object payload with a masked card number and returns it masked', () => {
    const masked = maskPayload({ cardNumber: '123456XXXXXXXXX7890' });
    masked.cardNumber.should.eql('123456XXXXXXXXX7890');
  });
  it('takes an object payload with a alpha card number and returns it unchanged', () => {
    const masked = maskPayload({ cardNumber: 'TheBadger00000001' });
    masked.cardNumber.should.eql('TheBadger00000001');
  });
  it('takes an object payload with a long card number and returns it unchanged', () => {
    const masked = maskPayload({
      cardNumber: 'TheBadger00000000000000000000000000000000000001',
    });
    masked.cardNumber.should.eql(
      'TheBadger00000000000000000000000000000000000001'
    );
  });
  it('takes an object payload with uuid as card number and returns it unchanged', () => {
    const masked = maskPayload({
      cardNumber: 'e27ced47-6f5a-404c-bf3a-54420b6b0e6c',
    });
    masked.cardNumber.should.eql('e27ced47-6f5a-404c-bf3a-54420b6b0e6c');
  });
});
