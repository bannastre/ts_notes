module.exports = {
  constants: {
    CORRELATION_HEADER: 'x-correlation-id',
    EXECUTION_HEADER: 'x-exec-id',
    TRACKING_NAMESPACE: 'tracking',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  environment: process.env.ENVIRONMENT,
  response_validation: process.env.RESPONSE_VALIDATION,
};
