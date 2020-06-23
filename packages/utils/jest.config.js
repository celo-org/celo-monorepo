module.exports = {
  preset: 'ts-jest',
  testEnvironment: '../flakey-test-tracking/lib/JestFlakeTrackingEnvironment.js',
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'],
}
