const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  ...nodeFlakeTracking,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', ...nodeFlakeTracking.setupFilesAfterEnv],
  testMatch: ['**/?(*.)(spec|test).ts?(x)'],
  testResultsProcessor: 'jest-junit',
  transform: {
    '\\.(ts|tsx)$': 'ts-jest',
  },
}
