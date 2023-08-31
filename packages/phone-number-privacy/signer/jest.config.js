module.exports = {
  preset: 'ts-jest',
  setupFiles: ['dotenv/config'],
  coverageReporters: [['lcov', { projectRoot: '../../../' }], 'text'],
  collectCoverageFrom: ['./src/**'],
  coverageThreshold: {
    global: {
      lines: 68, // TODO increase this threshold
    },
  },
}
