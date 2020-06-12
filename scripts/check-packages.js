const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

const FirebaseOrGAEProjects = ['faucet', 'web', 'notification-service']

// Set CWD to monorepo root
process.cwd(path.join(__dirname, '..'))

const pkgJsonPath = (name) => path.join('./packages', name, 'package.json')
const readJSON = (path) => JSON.parse(fs.readFileSync(path))
const readPkgJson = (name) => readJSON(pkgJsonPath(name))

const extractVersionNumber = (semverString) => {
  if (semverString[0] == '~' || semverString[0] == '^') {
    return semverString.slice(1)
  } else {
    return semverString
  }
}

const npmPackages = fs
  .readdirSync('./packages')
  .filter((name) => fs.existsSync(pkgJsonPath(name)))
  .filter((name) => !FirebaseOrGAEProjects.includes(name))
const pkgJsons = npmPackages.map((name) => readPkgJson(name))
const versionMap = new Map(pkgJsons.map((p) => [p.name, p.version]))

function getErrors(pkgJson) {
  const interDependencies = []
    .concat(
      Object.keys(pkgJson.dependencies || {})
        .filter((name) => versionMap.has(name))
        .map((name) => [name, pkgJson.dependencies[name]])
    )
    .concat(
      Object.keys(pkgJson.devDependencies || {})
        .filter((name) => versionMap.has(name))
        .map((name) => [name, pkgJson.devDependencies[name]])
    )

  const errors = []
  for ([name, versionString] of interDependencies) {
    if (extractVersionNumber(versionString) != versionMap.get(name)) {
      errors.push({
        from: pkgJson.name,
        to: name,
        expected: versionMap.get(name),
        got: versionString,
      })
    }
  }
  return errors
}

const errors = [].concat(...pkgJsons.map(getErrors).filter((err) => err.length > 0))

console.log(
  errors
    .map(
      (err) =>
        chalk`{red ${err.from}} => {red ${err.to}}. expected: {blue ${err.expected}} got: {green ${err.got}}`
    )
    .join('\n')
)

process.exit(errors.length > 0 ? 1 : 0)
