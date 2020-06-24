module.exports = {
  globals: {
    FLAKES: Map,
    RETRY_TIMES: 5,
  },
  preset: 'ts-jest',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: '../../flakey-test-tracking/jest/JestFlakeTrackingEnvironment.js',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
  testRunner: 'jest-circus/runner',
}
