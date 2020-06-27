const AnsiToHtml = require('ansi-to-html')
const convert = new AnsiToHtml()

const getTestID = (test) => {
  const titles = []
  let parent = test

  do {
    titles.unshift(parent.name)
  } while ((parent = parent.parent))

  titles.shift() // remove TOP_DESCRIBE_BLOCK_NAME

  return titles.join(' -> ')
}

const addFlakeErrorsToDescribeBlock = (describeBlock, flakeMap) => {
  for (const child of describeBlock.children) {
    switch (child.type) {
      case 'describeBlock': {
        addFlakeErrorsToDescribeBlock(child, flakeMap)
        break
      }
      case 'test': {
        const testID = getTestID(child)
        const flakeErrors = flakeMap.get(testID)
        if (flakeErrors !== undefined) {
          child.errors = flakeErrors
          child.status = 'flakey'
        }
      }
    }
  }
  return describeBlock
}

const parseTestFile = (stack) => {
  const start = stack.indexOf('/packages')
  const end = start + stack.slice(start).indexOf(' at ')
  return stack.slice(start, end)
}

const formatIssueBody = (errors) => {
  let body = ''
  let i = 1
  for (const e of errors) {
    body = body.concat('Attempt No. ' + i + ':\n\n' + e + '\n\n')
    i++
  }
  body = body.concat('Attempt No. ' + i + ':\n\n' + 'Test Passed!')
  return convert.toHtml(body)
}

module.exports = {
  getTestID: getTestID,
  formatIssueBody: formatIssueBody,
  addFlakeErrorsToDescribeBlock: addFlakeErrorsToDescribeBlock,
  parseTestFile: parseTestFile,
}
