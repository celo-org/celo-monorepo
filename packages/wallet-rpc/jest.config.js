module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  globalSetup: '<rootDir>/test-utils/setup.global.ts',
  globalTeardown: '<rootDir>/test-utils/teardown.global.ts',
  testSequencer: '<rootDir>/test-utils/AlphabeticSequencer.js',
}
