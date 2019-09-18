const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  globals: {
    navigator: true,
    'ts-jest': {
      isolatedModules: true,
      tsConfig: 'tsconfig.test.json',
    },
    window: true,
  },
  moduleDirectories: ['.', '../../node_modules', './node_modeles'],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', '.png', '.jpg'],
  moduleNameMapper: {
    '^[./a-zA-Z0-9$_-]+\\.(png|jpg)$': '<rootDir>/__mocks__/ImageStub.ts',
    'next-i18next': '<rootDir>/node_modules/next-i18next',
    'next/config': '<rootDir>/__mocks__/next-server/config',
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/(.*)/node_modules/react-native'],
  preset: './node_modules/react-native-web/jest-preset.js',
  setupFiles: ['jest-canvas-mock'],
  setupFilesAfterEnv: ['<rootDir>/jest_setup.ts'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!(@celo/)?react-native|date-fns)'],
}
