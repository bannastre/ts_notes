const helmet = require('helmet');

const security = () => {
  return helmet();
};

module.exports = { security };
