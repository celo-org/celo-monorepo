const { shouldTrackFlakes, numRetries } = require('../config')

module.exports = shouldTrackFlakes
  ? {
      reporter: require.resolve('./reporter'),
      retries: numRetries,
    }
  : {}
