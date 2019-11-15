module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['./setupJest.ts'],
  testMatch: ['**/?(*.)(spec|test).ts?(x)'],
  // testResultsProcessor: 'jest-junit',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}
