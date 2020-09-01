const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...nodeFlakeTracking,
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: [...nodeFlakeTracking.setupFilesAfterEnv],
  verbose: true,
}
