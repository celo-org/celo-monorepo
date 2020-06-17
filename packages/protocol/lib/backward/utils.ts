import {
  ASTCodeCompatibilityReport,
  CategorizerChangeVisitor,
  Change, ChangeType,
  createIndexByChangeType, reportASTIncompatibilities
} from '@celo/protocol/lib/backward/ast-code';
import { ASTStorageCompatibilityReport, reportLayoutIncompatibilities } from '@celo/protocol/lib/backward/ast-layout';
import { BuildArtifacts, Contracts, getBuildArtifacts } from '@openzeppelin/upgrades';
import { readJsonSync } from 'fs-extra';

const V_STORAGE = 's'
const V_MAJOR = 'x'
const V_MINOR = 'y'
const V_PATCH = 'z'

export class ASTBackwardReport {
  // Artifacts comparison folders
  oldArtifactsFolder: string
  newArtifactsFolder: string
  
  // Full reports
  codeReport: ASTCodeCompatibilityReport
  storageReports: ASTStorageCompatibilityReport[]

  // Conflict reports/changes
  storage: ASTStorageCompatibilityReport[]
  major: Change[]
  minor: Change[]
  patch: Change[]

  // Exclusion pattern for backward checks
  exclude: string

  // Delta suggested
  versionDelta: string

  excludeContracts = (contractNameRegexp: RegExp): void => {
    const included = (contract: string): boolean => {
      if (contractNameRegexp != null) {
        return !contractNameRegexp.test(contract)
      }
      return true
    }
    this.codeReport.changes = this.codeReport.changes.filter(r => included(r.getContract()))
    this.storageReports = this.storageReports.filter(r => included(r.contract))
  }
}

export const isValidVersion = (version: string): boolean => {
  const v = version.split(".")
  if (v.length !== 4) {
    return false
  }
  return !isNaN(Number(v[0])) && !isNaN(Number(v[1])) && !isNaN(Number(v[2])) && !isNaN(Number(v[3]))
}

const applyDelta = (n: number, d: string, c: string): number => {
  if (d === "0") {
    return 0
  }
  if (d === (c + "+1")) {
    return (n + 1)
  }
  if (d === (c)) {
    return n
  }
  throw new Error(`Invalid delta singular format: ${d} for character ${c}`)
}

export const versionAddDelta = (version: string, delta: string) => {
  if (!isValidVersion(version)) {
    throw new Error(`Invalid version format: ${version}`)
  }
  const v = version.split(".")
  const storage = Number(v[0])
  const major = Number(v[1])
  const minor = Number(v[2])
  const patch = Number(v[3])
  const d = delta.split(".")
  return applyDelta(storage, d[0], V_STORAGE) 
  + "." + applyDelta(major, d[1], V_MAJOR)
  + "." + applyDelta(minor, d[2], V_MINOR)
  + "." + applyDelta(patch, d[3], V_PATCH)
}

const ensureValidArtifacts = (artifactsPaths: string[]): void => {
  artifactsPaths.forEach((path) => {
    const artifact = readJsonSync(path)
    if (artifact.ast === undefined) {
      console.error(`ERROR: invalid artifact file found: '${path}'`)
      process.exit(10001)
    }
  })
}

export const instantiateArtifacts = (buildDirectory: string): BuildArtifacts => {
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

const createSemanticVersionDelta = (report: ASTBackwardReport) => {
  if (report.storage.length > 0) {
    return `${V_STORAGE}+1.0.0.0`
  }
  if (report.major.length > 0) {
    return `${V_STORAGE}.${V_MAJOR}+1.0.0`
  }
  if (report.minor.length > 0) {
    return `${V_STORAGE}.${V_MAJOR}.${V_MINOR}+1.0`
  }
  if (report.minor.length > 0) {
    return `${V_STORAGE}.${V_MAJOR}.${V_MINOR}.${V_PATCH}+1`
  }
  return `${V_STORAGE}.${V_MAJOR}.${V_MINOR}.${V_PATCH}`
}

export const createReport = (oldArtifactsFolder: string, newArtifactsFolder: string, exclude: string, logFunction: (msg: string) => void): ASTBackwardReport => {
  logFunction("Instantiating old artifacts...")
  const artifacts1 = instantiateArtifacts(oldArtifactsFolder)
  logFunction("Done\n")
  logFunction("Instantiating new artifacts...")
  const artifacts2 = instantiateArtifacts(newArtifactsFolder)
  logFunction("Done\n")
  const report = new ASTBackwardReport()
  // Run reports
  logFunction("Running storage report...")
  report.storageReports = reportLayoutIncompatibilities(artifacts1, artifacts2)
  logFunction("Done\n")
  logFunction("Running code report...")
  report.codeReport = reportASTIncompatibilities(artifacts1, artifacts2)
  logFunction("Done\n")

  report.exclude = exclude
  const excludeRegexp: RegExp = exclude? new RegExp(exclude) : null
  
  report.excludeContracts(excludeRegexp)

  logFunction("Generating backward report...")
  report.storage = report.storageReports
    .filter(r => !r.compatible)

  const byChangeType = createIndexByChangeType(
    report.codeReport.changes, 
     new CategorizerChangeVisitor()
  )
  report.major = byChangeType[ChangeType.Major]
  report.minor = byChangeType[ChangeType.Minor]
  report.patch = byChangeType[ChangeType.Patch]
  report.versionDelta = createSemanticVersionDelta(report)
  logFunction("Done\n")
  return report
}
