const flakeTrackingConfig = require('../../flakey-test-tracking/jest/jest.config.base.js')

module.exports = {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  ...flakeTrackingConfig,
}
