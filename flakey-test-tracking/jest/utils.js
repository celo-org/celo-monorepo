const AnsiToHtml = require('ansi-to-html')
const convert = new AnsiToHtml()

const getTestTitles = (test) => {
  const titles = []
  let parent = test

  do {
    titles.unshift(parent.name)
  } while ((parent = parent.parent))

  return titles
}

function fmtTestTitles(titles) {
  if (process.env.CIRCLECI) {
    titles[0] = process.env.CIRCLE_JOB
  } else {
    titles.shift()
  }
  return titles.join(' -> ').trim()
}

const getTestID = (test) => {
  return fmtTestTitles(getTestTitles(test))
}

const buildFlakeyDescribe = (describeBlock, flakeMap) => {
  for (const child of describeBlock.children) {
    switch (child.type) {
      case 'describeBlock': {
        buildFlakeyDescribe(child, flakeMap)
        break
      }
      case 'test': {
        const testID = getTestID(child)
        const flakeErrors = flakeMap.get(testID)
        if (flakeErrors !== undefined) {
          child.errors = flakeErrors
          child.status = 'flakey'
        }
        break
      }
    }
  }
  return describeBlock
}

function parseFlake(tr) {
  const testID = fmtTestTitles(tr.testPath)
  const body = fmtIssueBody(tr.errors)
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
  return convert.toHtml(body)
}

module.exports = {
  getTestID: getTestID,
  fmtIssueBody: fmtIssueBody,
  buildFlakeyDescribe: buildFlakeyDescribe,
  parseTestLocation: parseTestLocation,
  parseFlake: parseFlake,
}
