const { fmtFlakeIssue, fmtTestTitles } = require('../utils')

// We build a fake describe block object where all flakey tests
// maintain references to the errors from their retries. Normally,
// jest wipes errors from retries and only remembers errors from full
// failures. We can feed this fake describe block object to jest and
// trick it into formatting all the retry errors nicely for us.
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

const getTestID = (test) => {
  // Note that fmtTestTitles prepends `circleJobName -> packageName` to the test titles
  return fmtTestTitles(getTestTitles(test))
}

// Returns an array of titles starting with the test title and ending with
// the title of the top-level describe blockcontaining the test. This effectively
// provides a 'path' to the test. Note that while jest implements this logic
// for TestResult objects (the output of makeRunResult), we have to do it ourselves
// for TestEntry objects.
const getTestTitles = (test) => {
  const titles = []
  let parent = test

  do {
    titles.push(parent.name)
  } while ((parent = parent.parent))

  titles.pop() // Removes ROOT_DESCRIBE_BLOCK

  return titles.reverse()
}

// If we already have the the array of titles (i.e. we are using a TestResult object)
// then we do not need the logic from getTestTitles() above.
const getTestIDFromTestPath = (testPath) => {
  testPath.shift() // Removes ROOT_DESCRIBE_BLOCK
  return fmtTestTitles(testPath)
}

module.exports = {
  buildFlakeyDescribe: buildFlakeyDescribe,
  getTestID: getTestID,
  getTestIDFromTestPath: getTestIDFromTestPath,
  fmtFlakeIssue: fmtFlakeIssue,
  fmtTestTitles: fmtTestTitles,
}
