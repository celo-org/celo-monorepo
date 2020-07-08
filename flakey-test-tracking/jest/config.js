const { shouldTrackFlakes, numRetries, skipKnownFlakes } = require('../config')

const flakeTrackingConfig = {
  //globalSetup: require.resolve('./setup.global.js'),
  globals: {
    FLAKES: Map,
    RETRY_TIMES: numRetries,
    SKIP_FLAKES: skipKnownFlakes,
  },
  setupFilesAfterEnv: [require.resolve('./setup.js')],
  testEnvironment: require.resolve('./environment.js'),
  testRunner: 'jest-circus/runner',
}

const defaultConfig = {
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
}

module.exports = shouldTrackFlakes ? flakeTrackingConfig : defaultConfig
