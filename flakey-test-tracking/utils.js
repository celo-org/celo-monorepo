const AnsiToHtml = require('ansi-to-html')
const convert = new AnsiToHtml()

const fmtFlakeIssue = (testID, errors) => {
  return {
    title: '[FLAKEY TEST] ' + testID,
    body: fmtIssueBody(errors),
  }
}

const fmtIssueBody = (errors) => {
  errors.push('Test Passed!')
  let body = ''
  for (let i = 0; i < errors.length; i++) {
    body += 'Attempt No. ' + (i + 1) + ':\n\n' + errors[i] + '\n\n'
  }
  return convert.toHtml(body)
}

function fmtTestTitles(titles) {
  if (process.env.CIRCLECI) {
    titles[0] = process.env.CIRCLE_JOB
  } else {
    titles.shift()
  }
  return titles.join(' -> ').trim()
}

module.exports = {
  fmtFlakeIssue: fmtFlakeIssue,
  fmtTestTitles: fmtTestTitles,
}
