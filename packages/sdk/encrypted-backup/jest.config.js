const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...nodeFlakeTracking,
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: [
    '@celo/dev-utils/lib/matchers',
    '<rootDir>/jestSetup.ts',
    ...nodeFlakeTracking.setupFilesAfterEnv,
  ],
  verbose: true,
}
