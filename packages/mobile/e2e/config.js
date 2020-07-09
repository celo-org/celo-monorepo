const { detoxFlakeTracking } = require('../../../flakey-test-tracking/jest/config.js')

module.exports = {
  ...detoxFlakeTracking,
  bail: 3,
  reporters: ['detox/runners/jest/streamlineReporter'],
  verbose: true,
  testMatch: ['**/*.spec.js'],
  testTimeout: 120000,
}
