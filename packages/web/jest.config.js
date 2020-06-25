const defaultConfig = require('../../jest.config.js')
const flakeTrackingConfig = require('../../flakey-test-tracking/jest/jest.config.base.js')

module.exports = {
  ...defaultConfig,
  ...flakeTrackingConfig,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsConfig: 'tsconfig.jest.json',
    },
    ...flakeTrackingConfig.globals,
  },
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif)$': '<rootDir>/__mocks__/ImageStub.ts',
    '\\.(css|scss)$': '<rootDir>/__mocks__/ImageStub.ts',
    '\\.(md)$': '<rootDir>/__mocks__/MarkdownStub.ts',
    'pages/(.*)$': '<rootDir>/pages/$1',
    'src/(.*)$': '<rootDir>/src/$1',
    'public/(.*)$': '<rootDir>/public/$1',
  },
  preset: 'react-native-web',
  setupFiles: ['./jestSetup.js', 'jest-canvas-mock'],
  setupFilesAfterEnv: ['./jestSetupAfter.ts', ...flakeTrackingConfig.setupFilesAfterEnv],
  testEnvironment: 'jsdom', //TODO(Alec)
}
