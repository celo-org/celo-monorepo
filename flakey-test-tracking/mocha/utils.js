const { fmtFlakeIssue, fmtTestTitles } = require('../utils')

const getTestID = (runnable) => {
  return fmtTestTitles(runnable.titlePath())
}

const getTestIDFromSuite = (suite, testTitle) => {
  return getTestID(suite).concat(' -> ', testTitle)
}

module.exports = {
  getTestID: getTestID,
  getTestIDFromSuite: getTestIDFromSuite,
  fmtFlakeIssue: fmtFlakeIssue,
}
