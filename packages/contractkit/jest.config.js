const { pathsToModuleNameMapper } = require('ts-jest/utils')

const { compilerOptions } = require('./test/tsconfig')

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/test/tsconfig.json',
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/test-utils/matchers.ts'],
  globalSetup: '<rootDir>/test/test-utils/ganache.setup.ts',
  globalTeardown: '<rootDir>/test/test-utils/ganache.teardown.ts',
}
