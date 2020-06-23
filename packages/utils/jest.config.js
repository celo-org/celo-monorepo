module.exports = {
  preset: 'ts-jest',
  testEnvironment: '../../flakey-test-tracking/JestFlakeTrackingEnvironment.js',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
}
