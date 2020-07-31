const { numRetries } = require('./config')
jest.retryTimes(numRetries)
// This is run at the beginning of each top-level describe block
