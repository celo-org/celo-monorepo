const { shouldTrackFlakes, numRetries } = require('../config')

const flakeTrackingConfig = shouldTrackFlakes
  ? {
      reporter: require.resolve('./reporter'),
      retries: numRetries,
    }
  : {}

const truffleFlakeTrackingConfig = shouldTrackFlakes
  ? {
      reporter: require.resolve('./reporter'),
      ui: require.resolve('./interface'),
      retries: numRetries,
    }
  : {}

module.exports = {
  truffleFlakeTrackingConfig: truffleFlakeTrackingConfig,
  flakeTrackingConfig: flakeTrackingConfig,
}
