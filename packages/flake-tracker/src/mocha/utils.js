const { fmtFlakeIssue, fmtTestTitles } = require('../utils')

// Returns a 'path' to the test the same way that getTestID in ../jest does.
// i.e. rootDescribeBlockTitle -> childDescribeBlockTitle -> testTitle
const getTestID = (runnable) => {
  // Note that fmtTestTitles also prepends `circleJobName -> packageName` to the titlePath
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
