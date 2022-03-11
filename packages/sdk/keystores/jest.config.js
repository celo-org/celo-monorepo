const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  ...nodeFlakeTracking,
}
