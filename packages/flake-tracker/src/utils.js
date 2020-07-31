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
const warningLight = String.fromCodePoint(0x1f6a8)

const flakeTitlePrefix = '[FLAKEY TEST] '

const statuses = {
  failure: 'flakey tests were found',
  neutral: 'flakey tests were skipped',
  success: 'no flakey tests found!',
}

const emojis = {
  failure: redX,
  neutral: warningLight,
  success: greenCheck,
}

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
  if (process.env.CIRCLECI && process.env.CIRCLE_BRANCH !== 'master') {
    const prUrl = process.env.CIRCLE_PULL_REQUEST
    return prUrl.slice(prUrl.lastIndexOf('/') + 1)
  }
}

// Parses list of flakey test issues to ignore from the PR's body.
// The tests corresponding to these issues will not be skipped.
function parseMandatoryTestIssuesFromPullBody(prBody) {
  const urls = prBody.match(/https?[\S]+issues\/[0-9]+/g) || []
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

function parseDownFlakeIssue(issue) {
  return (({ title, html_url, number, body }) => ({
    title,
    html_url,
    number,
    body,
  }))(issue)
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
      return 'Some tests were skipped due to flakiness. No new flakey tests were found.'
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

function sumVals(obj) {
  return Object.values(obj).reduce((acc, x) => acc + x, 0)
}

// Use i == 0 for breakdowns by job, i == 1 for breakdowns by package
function parseBreakdown(breakdownByTestSuite, i) {
  const breakdown = {}
  Object.keys(breakdownByTestSuite).forEach((testSuite) => {
    const key = testSuite.split(' -> ')[i] // We id test suites by `jobName -> packageName`
    breakdown[key] = breakdown[key]
      ? breakdown[key] + breakdownByTestSuite[testSuite]
      : breakdownByTestSuite[testSuite]
  })
  return breakdown
}

function fmtBreakdown(breakdownByTestSuite, total) {
  let text = ''
  const breakdownByPackage = parseBreakdown(breakdownByTestSuite, 1)
  const breakdownByJob = parseBreakdown(breakdownByTestSuite, 0)

  const fmtPercentage = (n, d) => {
    return ((n / d) * 100).toFixed(1) + '%'
  }

  text += '\n\tBy Package:\n'
  Object.keys(breakdownByPackage).forEach((pkg) => {
    const num = breakdownByPackage[pkg]
    text += '\n\t\t' + pkg + ': ' + num + ' (' + fmtPercentage(num, total) + ')\n'
  })

  text += '\n\tBy Job:\n'
  Object.keys(breakdownByJob).forEach((job) => {
    const num = breakdownByJob[job]
    text += '\n\t\t' + job + ': ' + num + ' (' + fmtPercentage(num, total) + ')\n'
  })

  return text
}

function parseNumFlakes(text, regex) {
  return (text.match(regex) || [])
    .map((str) => str.replace(/[^0-9]+/, ''))
    .reduce((acc, x) => acc + Number(x), 0)
}

// This is used only by the flakey-test-summary job added to the end of the workflow
function fmtWorkflowSummary(foundFlakes, skippedFlakes, totalFlakes) {
  let summary = '\n_____FlakeTracker Workflow Summary_____\n'

  const total = sumVals(totalFlakes)
  const found = sumVals(foundFlakes)
  const skipped = sumVals(skippedFlakes)

  summary +=
    '\nTotal flakey tests in this workflow: ' +
    total +
    ' ' +
    '(discovered: ' +
    found +
    ', skipped: ' +
    skipped +
    ')\n'

  if (total) {
    summary += '\nBreakdown of all flakey tests:\n' + fmtBreakdown(totalFlakes, total)
    if (found) {
      summary += '\nBreakdown of new flakey tests:\n' + fmtBreakdown(foundFlakes, found)
    }
    if (skipped) {
      summary += '\nBreakdown of skipped flakey tests:\n' + fmtBreakdown(skippedFlakes, skipped)
    }
  }

  return summary
}

function getRandomSuccessImage() {
  const fmtImage = (url) => {
    return {
      image_url: url,
      alt: 'Hooray! ' + url,
    }
  }
  const images = [
    // Please add more gifs :)
    'https://media.giphy.com/media/mQG644PY8O7rG/source.gif',
    'https://media.giphy.com/media/4xpB3eE00FfBm/source.gif',
    'https://media.giphy.com/media/kBZBlLVlfECvOQAVno/source.gif',
    'https://media.giphy.com/media/l4JySAWfMaY7w88sU/source.gif',
    'https://media.giphy.com/media/2fQ1Gq3KOpvNs4NTmu/source.gif',
  ].map(fmtImage)
  return images[Math.floor(Math.random() * images.length)]
}

function calcObsoleteFlakeIssues(skippedTests, knownFlakes) {
  return knownFlakes.filter((i) => !skippedTests.some((skipped) => i.title.includes(skipped)))
}

module.exports = {
  calcObsoleteFlakeIssues: calcObsoleteFlakeIssues,
  emojis: emojis,
  fmtFlakeIssue: fmtFlakeIssue,
  fmtSummary: fmtSummary,
  fmtTestTitles: fmtTestTitles,
  fmtWorkflowSummary: fmtWorkflowSummary,
  getConclusion: getConclusion,
  getPackageName: getPackageName,
  getPullNumber: getPullNumber,
  getRandomSuccessImage: getRandomSuccessImage,
  getTestSuiteDir: getTestSuiteDir,
  getTestSuiteTitles: getTestSuiteTitles,
  parseDownFlakeIssue: parseDownFlakeIssue,
  parseErrLineNumberFromStack: parseErrLineNumberFromStack,
  parseFirstErrFromFlakeBody: parseFirstErrFromFlakeBody,
  parseFirstLineOfStack: parseFirstLineOfStack,
  parseMandatoryTestIssuesFromPullBody: parseMandatoryTestIssuesFromPullBody,
  parseNumFlakes: parseNumFlakes,
  parsePathFromStack: parsePathFromStack,
  parseTestIdFromFlakeTitle: parseTestIdFromFlakeTitle,
  statuses: statuses,
}
