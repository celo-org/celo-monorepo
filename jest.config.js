module.exports = {
  collectCoverageFrom: ['**/src/**/*.ts', '!**/*.d.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/?(*.)(spec|test).ts'],
  transform: {
    '\\.ts$': 'ts-jest',
  },
}
