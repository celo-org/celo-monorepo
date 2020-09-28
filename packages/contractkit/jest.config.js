const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...nodeFlakeTracking,
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: [
    '@celo/dev-utils/lib/matchers',
    '<rootDir>/jest_setup.ts',
    ...nodeFlakeTracking.setupFilesAfterEnv,
  ],
  globalSetup: '<rootDir>/src/test-utils/setup.global.ts',
  globalTeardown: '<rootDir>/src/test-utils/teardown.global.ts',
  testSequencer: '<rootDir>/src/test-utils/AlphabeticSequencer.js',
  verbose: true,
}
