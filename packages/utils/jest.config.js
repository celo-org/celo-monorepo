const { nodeFlakeTracking } = require('../../flakey-test-tracking/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  ...nodeFlakeTracking,
}
