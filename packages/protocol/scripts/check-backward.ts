import { ASTCompatibilityReport, reportASTIncompatibilities } from '@celo/protocol/lib/ast-backward'
import { BuildArtifacts, Contracts, getBuildArtifacts } from '@openzeppelin/upgrades'
import { readJsonSync } from 'fs-extra'

const CODE_MAJOR_CHANGE = 103
const CODE_MINOR_CHANGE = 102
const CODE_NO_CHANGE = 0

const args = process.argv.slice(2)

if (args.length !== 2) {
  console.error('USAGE: check-backward <artifacts-directory-before> <artifacts-directory-after>')
  process.exit(1)
}

const ensureValidArtifacts = (artifactsPaths: string[]): void => {
  artifactsPaths.forEach((path) => {
    const artifact = readJsonSync(path)
    if (artifact.ast == undefined) {
      console.error(`ERROR: invalid artifact file found: '${path}'`)
      process.exit(10001)
    }
  })
}

const instantiateArtifacts = (buildDirectory: string): BuildArtifacts => {
  // Check if all jsons in the buildDirectory are valid artifacts,
  // otherwise getBuildArtifacts fail with the enigmatic
  // "Cannot read property 'absolutePath' of undefined"
  ensureValidArtifacts(Contracts.listBuildArtifacts(buildDirectory))
  try {
    return getBuildArtifacts(buildDirectory)
  } catch (error) {
    console.error(`ERROR: could not create BuildArtifacts on directory '${buildDirectory}`)
    process.exit(10002)
  }
}

const artifacts1 = instantiateArtifacts(args[0])
const artifacts2 = instantiateArtifacts(args[1])

const printChanges = (title: string, changes: string[]) => {
  if (changes.length > 0) {
    console.log(`- ${title}`)
  }
  changes.forEach((c: string) => console.log(`-- ${c}`))
}

const printReport = (report: ASTCompatibilityReport) => {
  var exitCode = CODE_NO_CHANGE
  var changeMessage = `No change in APIs`
  if (report.majorChanges.length > 0) {
    changeMessage = `MAJOR contracts version change`
    exitCode = CODE_MAJOR_CHANGE
  } else {
    if (report.minorChanges.length > 0) {
      changeMessage = `MINOR contracts version change`
      exitCode = CODE_MINOR_CHANGE
    }
  }
  printChanges('MAJOR changes', report.majorChanges)
  printChanges('MINOR changes', report.minorChanges)
  console.log(changeMessage)
  return exitCode
}

try {
  process.exit(printReport(reportASTIncompatibilities(artifacts1, artifacts2)))
} catch (error) {
  if (!!error.message) {
    console.error(error.message)
  } else {
    console.error(error)
  }
  process.exit(10003)
}
