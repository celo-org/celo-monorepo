const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsConfig: 'tsconfig.jest.json',
    },
  },
  moduleNameMapper: {
    'src/(.*)$': '<rootDir>/src/$1',
  },
  preset: 'react-native-web',
  testEnvironment: 'node',
}
