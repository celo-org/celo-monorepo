const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsConfig: 'tsconfig.jest.json',
    },
  },
  setupFiles: ['./jestSetup.js', 'jest-canvas-mock'],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg)$': '<rootDir>/__mocks__/ImageStub.ts',
    'pages/(.*)$': '<rootDir>/pages/$1',
    'src/(.*)$': '<rootDir>/src/$1',
  },
  preset: 'react-native-web',
  testEnvironment: 'jsdom',
}
