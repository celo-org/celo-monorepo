const { fmtFlakeIssue, fmtTestTitles } = require('../utils')

const getTestID = (runnable) => {
  return fmtTestTitles(runnable.titlePath())
}

const getTestIDFromSuite = (suite, testTitle) => {
  return getTestID(suite).concat(' -> ', testTitle)
}

const fmtError = (err) => {
  return err.stack || err || 'err undefined'
}

module.exports = {
  getTestID: getTestID,
  getTestIDFromSuite: getTestIDFromSuite,
  fmtError: fmtError,
  fmtFlakeIssue: fmtFlakeIssue,
}
