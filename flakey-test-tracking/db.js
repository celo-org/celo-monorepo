const { tmpdir } = require('os')
const { join } = require('path')
const fs = require('fs')
const tmp = require('tmp')
tmp.setGracefulCleanup()

const flakeDir = 'flake-tracker'
const errDir = 'new-flakes'
const skipFile = 'known-flakes.txt'

const delim = '\n===============\n'

const saveError = (testID, err) => {
  fs.appendFileSync(join(tmpdir(), flakeDir, errDir, fmtTestKey(testID)), err + delim)
}

const getErrors = (testID) => {
  return readFileInFlakeDir(join(errDir, fmtTestKey(testID)))
}

const fmtTestKey = (testID) => {
  // Remove special characters, whitespace and `Contract` prefix from file name.
  return testID.replace(/\w/g, '_').replace('Contract', '')
}

const saveKnownFlakes = (flakes) => {
  fs.writeFileSync(join(tmpdir(), flakeDir, skipFile), flakes.join(delim))
}

const getKnownFlakes = () => {
  return readFileInFlakeDir(skipFile)
}

const readFileInFlakeDir = (file) => {
  const buf = fs.readFileSync(join(tmpdir(), flakeDir, file))
  return buf.toString().split(delim)
}

const mkFlakeDir = () => {
  mkTmpDir(flakeDir)
  mkDir(join(tmpdir(), flakeDir, errDir))
}

const mkDir = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

// This directory will be automatically removed on process exit.
const mkTmpDir = (name) => {
  if (!fs.existsSync(join(tmpdir(), name))) {
    tmp.dirSync({
      name: name,
      unsafeCleanup: true,
    })
  }
}

module.exports = {
  mkFlakeDir: mkFlakeDir,
  saveError: saveError,
  getErrors: getErrors,
  saveKnownFlakes: saveKnownFlakes,
  getKnownFlakes: getKnownFlakes,
}
