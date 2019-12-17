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
    '^[./a-zA-Z0-9$_-]+\\.(png|jpg)$': '<rootDir>/__mocks__/ImageStub.ts',
    'src/(.*)$': '<rootDir>/src/$1',
  },
  preset: 'react-native-web',
  testEnvironment: 'node',
}
