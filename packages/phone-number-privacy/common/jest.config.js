module.exports = {
  preset: 'ts-jest',
  coverageReporters: [['lcov', { projectRoot: '../../../' }], 'text'],
  collectCoverageFrom: ['./src/**'],
  coverageThreshold: {
    global: {
      lines: 78, // TODO(2.0.0) make this higher in testing audit ticket (https://github.com/celo-org/celo-monorepo/issues/9811)
    },
  },
}
