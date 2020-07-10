const { fmtFlakeIssue, fmtTestTitles } = require('../utils')

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
  return fmtTestTitles(getTestTitles(test))
}

const getTestTitles = (test) => {
  const titles = []
  let parent = test

  do {
    titles.unshift(parent.name)
  } while ((parent = parent.parent))

  return titles
}

module.exports = {
  buildFlakeyDescribe: buildFlakeyDescribe,
  getTestID: getTestID,
  fmtFlakeIssue: fmtFlakeIssue,
  fmtTestTitles: fmtTestTitles,
}
