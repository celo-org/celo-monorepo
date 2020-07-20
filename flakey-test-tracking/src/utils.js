// Emojis
const fire = String.fromCodePoint(0x1f525)
const partyFace = String.fromCodePoint(0x1f973)
const stressFace = String.fromCodePoint(0x1f613)
const greenCheck = String.fromCodePoint(0x2705)
const redX = String.fromCodePoint(0x274c)
const snowflake = String.fromCharCode(0x2744)
const warning = String.fromCodePoint(0x26a0)
const relievedSmileFace = String.fromCodePoint(0x1f60c)
const hands = String.fromCodePoint(0x1f64c)

const flakeTitlePrefix = '[FLAKEY TEST] '

function fmtFlakeIssue(testID, errors) {
  return {
    title: flakeTitlePrefix + testID,
    body: fmtIssueBody(errors),
  }
}

function fmtIssueBody(errors) {
  errors.push('Test Passed!')
  let body = ''
  for (let i = 0; i < errors.length; i++) {
    body += 'Attempt No. ' + (i + 1) + ':\n\n' + errors[i] + '\n\n'
  }
  return body
}

function getPullNumber() {
  const prUrl = process.env.CIRCLE_PULL_REQUEST
  return prUrl.slice(prUrl.lastIndexOf('/') + 1)
}

// Parses list of flakey test issues to ignore from the PR's body.
// The tests corresponding to these issues will not be skipped.
function parseMandatoryTestIssuesFromPullBody(prBody) {
  // Slice off everything before list of mandatory test issues
  prBody = prBody.split('DO_NOT_SKIP')[1]
  // Slice off everything after list of mandatory test issues
  prBody = prBody.slice(0, prBody.indexOf('.'))
  // Return list of issue numbers
  return prBody.split(/[^0-9]+/gm)
}

function getPackageName() {
  const testSuiteDir = getTestSuiteDir()
  const i = testSuiteDir.indexOf('/')
  return i == -1 ? testSuiteDir : testSuiteDir.slice(0, i)
}

function getTestSuiteDir() {
  const rootDelim = 'packages/'
  return process.cwd().slice(process.cwd().lastIndexOf(rootDelim) + rootDelim.length)
}

function getTestSuiteTitles() {
  const titles = [getTestSuiteDir()]
  if (process.env.CIRCLECI) {
    titles.unshift(process.env.CIRCLE_JOB)
  }
  return titles
}

function fmtTestTitles(titles) {
  titles.unshift(...getTestSuiteTitles())
  return titles.join(' -> ').trim()
}

function parseFirstErrFromFlakeBody(body) {
  return body.split(/Attempt No\. [0-9]+:/g)[1]
}

function parseFirstLineOfStack(stack) {
  return stack.split('at ')[1]
}

function parsePathFromStack(stack) {
  return parseFirstLineOfStack(stack).split(':')[0]
}

function parseErrLineNumberFromStack(stack) {
  return Number(parseFirstLineOfStack(stack).split(':')[1])
}

function parseTestIdFromFlakeTitle(title) {
  return title.replace(flakeTitlePrefix, '').trim()
}

// You can set verbosity to either 0, 1, 2, 3, or 4
//  4 => header + list of skipped tests + errors from every retry for each new flakey test
//  3 => header + list of skipped tests + 1 errror for each new flakey test
//  2 => list skipped tests + list new flakey tests
//  1 => count of skipped tests + count of new flakey tests
//  0 => short one line status
function fmtSummary(flakes, skippedTests, verbosity) {
  if (![0, 1, 2, 3, 4].includes(verbosity)) {
    verbosity = 0 // default is lowest verbosity
  }

  if (verbosity == 0) {
    if (flakes.length) {
      return 'New flakiness detected ' + redX
    }
    if (skippedTests.length) {
      return 'Some tests were skipped due to flakiness. No new flakiness detected.'
    }
    return 'We have achieved zero flakiness ' + hands + ' ' + greenCheck
  }

  let summary = verbosity > 2 ? '\n_____FlakeTracker_____\n' : ''

  if (skippedTests.length) {
    summary += '\n' + warning + ' '
    if (skippedTests.length === 1) {
      summary += '1 flakey test was skipped \n'
    } else {
      summary += skippedTests.length + ' flakey tests were skipped \n'
    }
    if (verbosity > 1) {
      skippedTests.forEach((skip) => {
        summary += '\n' + skip + '\n'
      })
    }
  } else {
    summary += '\n' + fire + ' no flakey tests were skipped\n'
  }

  if (flakes.length) {
    summary += '\n' + stressFace + ' '
    if (flakes.length === 1) {
      summary += '1 new flakey test found\n'
    } else {
      summary += flakes.length + ' new flakey tests found\n'
    }
    switch (verbosity) {
      case 2:
        flakes.forEach((f) => {
          summary += '\n' + f.title + '\n'
        })
        break
      case 3:
        flakes.forEach((f) => {
          summary += '\n' + f.title + parseFirstErrFromFlakeBody(f.body) + '\n'
        })
        break
      case 4:
        let i = 0
        flakes.forEach((f) => {
          summary += '\n' + ++i + ')\n\n' + f.title + '\n\n' + f.body + '\n'
        })
        break
      default:
        break
    }
  } else {
    summary += '\n' + partyFace + ' no new flakey tests found!\n'
  }

  return summary
}

module.exports = {
  fmtFlakeIssue: fmtFlakeIssue,
  fmtSummary: fmtSummary,
  fmtTestTitles: fmtTestTitles,
  getPackageName: getPackageName,
  getPullNumber: getPullNumber,
  getTestSuiteDir: getTestSuiteDir,
  getTestSuiteTitles: getTestSuiteTitles,
  parseErrLineNumberFromStack: parseErrLineNumberFromStack,
  parseFirstErrFromFlakeBody: parseFirstErrFromFlakeBody,
  parseFirstLineOfStack: parseFirstLineOfStack,
  parseMandatoryTestIssuesFromPullBody: parseMandatoryTestIssuesFromPullBody,
  parsePathFromStack: parsePathFromStack,
  parseTestIdFromFlakeTitle: parseTestIdFromFlakeTitle,
}
