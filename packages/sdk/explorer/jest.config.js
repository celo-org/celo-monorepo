module.exports = {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: ['@celo/dev-utils/lib/matchers', '<rootDir>/jestSetup.ts'],
  verbose: true,
}
