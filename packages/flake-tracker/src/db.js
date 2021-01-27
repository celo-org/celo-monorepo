const { fmtFlakeIssue, getTestSuiteDir } = require('./utils')
const { tmpdir } = require('os')
const { join } = require('path')
const fs = require('fs')
const tmp = require('tmp')
tmp.setGracefulCleanup()

const flakeDir = 'flake-tracker_' + getTestSuiteDir().replace('/', '_')
const errDir = 'new-flakes'
const knownFlakeFile = 'known-flakes.txt'
const skippedFlakeFile = 'skipped-flakes.txt'

const delim = '\n===============\n'

const init = () => {
  mkTmpDir(flakeDir)
  mkDir(join(tmpdir(), flakeDir, errDir))
}

const writeErrors = (testID, errs) => {
  writeError(testID, errs.join(delim))
}

const writeError = (testID, err) => {
  const path = join(tmpdir(), flakeDir, errDir, fmtTestKey(testID))
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, testID)
  }
  fs.appendFileSync(path, delim + err)
}

const readErrors = (testID) => {
  return readFileInFlakeDir(join(errDir, fmtTestKey(testID)))
}

const readSkippedFlakes = () => {
  return readFileInFlakeDir(skippedFlakeFile)
}

const writeSkippedFlakes = (testIDs) => {
  if (testIDs.length) {
    writeSkippedFlake(testIDs.join(delim))
  }
}

const writeSkippedFlake = (testID) => {
  const path = join(tmpdir(), flakeDir, skippedFlakeFile)
  if (!fs.existsSync(path)) {
    fs.appendFileSync(path, testID)
  } else {
    fs.appendFileSync(path, delim + testID)
  }
}

const writeKnownFlakes = (flakes) => {
  if (flakes.length) {
    fs.writeFileSync(
      join(tmpdir(), flakeDir, knownFlakeFile),
      flakes.map((i) => JSON.stringify(i)).join(delim)
    )
  }
}

const readKnownFlakes = () => {
  return readFileInFlakeDir(knownFlakeFile).map(JSON.parse)
}

const readNewFlakes = () => {
  return fs.readdirSync(join(tmpdir(), flakeDir, errDir)).map(parseFlakeFile)
}

/* Helpers */

const parseFlakeFile = (fileName) => {
  const errors = readFileInFlakeDir(join(errDir, fileName))
  const testID = errors.shift()
  return fmtFlakeIssue(testID, errors)
}

const mkDir = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

// Creates a directory that will be automatically removed on process exit.
const mkTmpDir = (name) => {
  if (!fs.existsSync(join(tmpdir(), name))) {
    // Add option `keep: true` to keep flakey test files after process exits.
    // You can also specify a custom location for the files. This can be helpful for debugging.
    // See https://www.npmjs.com/package/tmp
    tmp.dirSync({
      name: name,
      unsafeCleanup: true,
    })
  }
}

const readFileInFlakeDir = (file) => {
  const path = join(tmpdir(), flakeDir, file)
  return fs.existsSync(path)
    ? fs
        .readFileSync(path)
        .toString()
        .split(delim)
    : []
}

const fmtTestKey = (testID) => {
  // Create unique file name by hashing test path and appending the test name.
  // Hashing is necessary because the full test path is too long.
  const titlePath = testID.split(' -> ')
  const testTitle = titlePath[titlePath.length - 1]
  const testKey = hashCode(testID)
    .concat('_', testTitle)
    .trim()
    .replace(/(\W)/g, '_')
  return testKey
}

const hashCode = (str) => {
  var hash = 0
  var chr
  for (var i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash.toString().trim()
}

module.exports = {
  readErrors: readErrors,
  readKnownFlakes: readKnownFlakes,
  readNewFlakes: readNewFlakes,
  readSkippedFlakes: readSkippedFlakes,
  init: init,
  writeError: writeError,
  writeErrors: writeErrors,
  writeKnownFlakes: writeKnownFlakes,
  writeSkippedFlake: writeSkippedFlake,
  writeSkippedFlakes: writeSkippedFlakes,
}
