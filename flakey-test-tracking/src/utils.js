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
  if (process.env.CIRCLECI) {
    const prUrl = process.env.CIRCLE_PULL_REQUEST
    return prUrl.slice(prUrl.lastIndexOf('/') + 1)
  }
}

// Parses list of flakey test issues to ignore from the PR's body.
// The tests corresponding to these issues will not be skipped.
function parseMandatoryTestIssuesFromPullBody(prBody) {
  const urls = prBody.match(/https?[\S]+issues\/[0-9]+/g)
  const issueNumbers = urls.map((url) =>
    url.slice(url.lastIndexOf('/') + 1).replace(/[^0-9]+/g, '')
  )
  return issueNumbers
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

function getConclusion(flakes, skippedTests) {
  let conclusion = 'failure'
  if (!flakes.length) {
    conclusion = skippedTests.length ? 'neutral' : 'success'
  }
  return conclusion
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

function getRandomHoorayImage() {
  // Please add more gifs :)
  const images = [
    'https://media.giphy.com/media/mQG644PY8O7rG/giphy.gif',
    'https://media.giphy.com/media/4xpB3eE00FfBm/giphy.gif',
  ]
  return images[Math.floor(Math.random() * images.length)]
}

function calcObsoleteFlakeIssues(skippedTests, knownFlakes) {
  return knownFlakes.filter((i) => !skippedTests.some((st) => i.title.includes(st)))
}

module.exports = {
  calcObsoleteFlakeIssues: calcObsoleteFlakeIssues,
  fmtFlakeIssue: fmtFlakeIssue,
  fmtSummary: fmtSummary,
  fmtTestTitles: fmtTestTitles,
  getConclusion: getConclusion,
  getPackageName: getPackageName,
  getPullNumber: getPullNumber,
  getRandomHoorayImage: getRandomHoorayImage,
  getTestSuiteDir: getTestSuiteDir,
  getTestSuiteTitles: getTestSuiteTitles,
  parseErrLineNumberFromStack: parseErrLineNumberFromStack,
  parseFirstErrFromFlakeBody: parseFirstErrFromFlakeBody,
  parseFirstLineOfStack: parseFirstLineOfStack,
  parseMandatoryTestIssuesFromPullBody: parseMandatoryTestIssuesFromPullBody,
  parsePathFromStack: parsePathFromStack,
  parseTestIdFromFlakeTitle: parseTestIdFromFlakeTitle,
}
