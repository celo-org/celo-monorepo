module.exports = {
  preset: 'ts-jest',
  rootDir: './src/',
  testMatch: ['<rootDir>/**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: ['@celo/dev-utils/lib/matchers'],
  globalSetup: '<rootDir>/test-utils/setup.global.ts',
  globalTeardown: '<rootDir>/test-utils/teardown.global.ts',
  verbose: true,
}
