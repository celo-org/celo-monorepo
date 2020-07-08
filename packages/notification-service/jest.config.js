const flakeTrackingConfig = require('../../flakey-test-tracking/jest/config.js')

module.exports = {
  ...flakeTrackingConfig,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', ...flakeTrackingConfig.setupFilesAfterEnv],
  testMatch: ['**/?(*.)(spec|test).ts?(x)'],
  testResultsProcessor: 'jest-junit',
  transform: {
    '\\.(ts|tsx)$': 'ts-jest',
  },
}
