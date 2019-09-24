const maskCardNumber = number => {
  if (Number.isNaN(parseInt(number, 10))) return number;
  const paddingSize = 19 - number.length;
  const padding = 'X'.repeat(paddingSize);
  return (
    number.slice(0, 6) +
    number
      .slice(6, -4)
      .replace(/.+/, 'X')
      .repeat(number.slice(6, -4).length) +
    padding +
    number.slice(-4, number.length)
  );
};

const maskPayload = payload => {
  try {
    if (!payload) return payload;
    if (typeof payload !== 'object') return payload;

    Object.keys(payload).forEach(property => {
      const value = payload[property];
      if (typeof value === 'object') {
        // eslint-disable-next-line no-param-reassign
        payload[property] = maskPayload(value);
      } else if (property === 'cardNumber') {
        // eslint-disable-next-line no-param-reassign
        payload[property] = maskCardNumber(value);
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(
      `{ message: 'Unhandled exception (${err.message})masking payload' }`
    );
  }
  return payload;
};

module.exports = {
  maskPayload,
  maskCardNumber,
};
