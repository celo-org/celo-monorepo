const flakeTrackingConfig = require('../../../flakey-test-tracking/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...flakeTrackingConfig,
}
