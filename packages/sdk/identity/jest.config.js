const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...nodeFlakeTracking,
  rootDir: './src/',
  testMatch: ['<rootDir>/**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: ['@celo/dev-utils/lib/matchers', ...nodeFlakeTracking.setupFilesAfterEnv],
  globalSetup: '<rootDir>/test-utils/setup.global.ts',
  globalTeardown: '<rootDir>/test-utils/teardown.global.ts',
  verbose: true,
}
