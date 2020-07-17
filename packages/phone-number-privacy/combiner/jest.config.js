const { nodeFlakeTracking } = require('../../../flakey-test-tracking/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...nodeFlakeTracking,
}
