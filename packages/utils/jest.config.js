const flakeTrackingConfig = require('../../flakey-test-tracking/jest/config.preset.js')

module.exports = {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  ...flakeTrackingConfig,
}
