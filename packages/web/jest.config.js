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
    '\\.(png|jpg|jpeg|gif)$': '<rootDir>/__mocks__/ImageStub.ts',
    '\\.(css|scss)$': '<rootDir>/__mocks__/ImageStub.ts',
    'pages/(.*)$': '<rootDir>/pages/$1',
    'src/(.*)$': '<rootDir>/src/$1',
    'public/(.*)$': '<rootDir>/public/$1',
  },
  preset: 'react-native-web',
  setupFiles: ['./jestSetup.js', 'jest-canvas-mock'],
  setupFilesAfterEnv: ['./jestSetupAfter.ts'],
  testEnvironment: 'jsdom',
}
