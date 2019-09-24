const axios = require('axios');

/**
 * Performs a ping on external services to check they are active
 *
 * @see {@ob-types/Application/ExternalService}
 *
 * @param {ExternalService[]} services
 * @return {ExternalService[]}
 */
const checkExternalServices = services => {
  if (services) {
    return Promise.all(
      services.map(async service => {
        const { status } = await axios.get(service.ping);
        return { ...service, status };
      })
    );
  }
};

module.exports = checkExternalServices;
