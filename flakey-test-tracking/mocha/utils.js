//const { utils } = require('mocha')

const getTestID = (runnable) => {
  return runnable.fullTitle()
}

const getTestIDFromSuite = (suite, testTitle) => {
  return getTestID(suite).concat(' ', testTitle)
}

const fmtFlakeIssue = (testID, errors) => {
  const body = fmtIssueBody(errors)
  return {
    title: '[FLAKEY TEST] ' + testID + ', at ' + parseTestLocation(body, '/packages'),
    body: body,
  }
}

const parseTestLocation = (stack, rootDir) => {
  const start = stack.indexOf(rootDir)
  const end = start + stack.slice(start).indexOf(' at ')
  return stack.slice(start, end)
}

const fmtIssueBody = (errors) => {
  errors.push('Test Passed!')
  let body = ''
  for (let i = 0; i < errors.length; i++) {
    body += 'Attempt No. ' + (i + 1) + ':\n\n' + errors[i] + '\n\n'
  }
  return body
}

module.exports = {
  getTestID: getTestID,
  getTestIDFromSuite: getTestIDFromSuite,
  fmtFlakeIssue: fmtFlakeIssue,
}
