const flakeTrackingConfig = require('../../../flakey-test-tracking/jest/config.preset.js')

module.exports = {
  preset: 'ts-jest',
  ...flakeTrackingConfig,
}
