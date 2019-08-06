module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/?(*.)(spec|test).ts?(x)'],
  testResultsProcessor: 'jest-junit',
  transform: {
    '\\.(ts|tsx)$': 'ts-jest',
  },
}
