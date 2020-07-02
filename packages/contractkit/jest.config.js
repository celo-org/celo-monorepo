const flakeTrackingConfig = require('../../flakey-test-tracking/jest/config.preset.js')

module.exports = {
  preset: 'ts-jest',
  ...flakeTrackingConfig,
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: ['@celo/dev-utils/lib/matchers', ...flakeTrackingConfig.setupFilesAfterEnv],
  globalSetup: '<rootDir>/src/test-utils/ganache.setup.ts',
  globalTeardown: '<rootDir>/src/test-utils/ganache.teardown.ts',
  testSequencer: '<rootDir>/src/test-utils/AlphabeticSequencer.js',
  verbose: true,
}
