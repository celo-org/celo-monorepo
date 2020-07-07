import {
  ASTCodeCompatibilityReport,



  Change, ChangeType, ChangeVisitor,

  reportASTIncompatibilities
} from '@celo/protocol/lib/backward/ast-code'
import { ASTStorageCompatibilityReport, reportLayoutIncompatibilities } from '@celo/protocol/lib/backward/ast-layout'
import { Categorizer } from '@celo/protocol/lib/backward/categorizer'
import { ContractVersionDelta, deltaFromChanges } from '@celo/protocol/lib/backward/version'
import { BuildArtifacts, Contracts, getBuildArtifacts } from '@openzeppelin/upgrades'
import { readJsonSync } from 'fs-extra'

/**
 * Backward compatibility report, based on both the abstract syntax tree analysis of
 * both the storage layout, and code API.
 */
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
  versionDelta: ContractVersionDelta

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

export const categorize = (changes: Change[], categorizer: ChangeVisitor<ChangeType>): Change[][] => {
  const byCategory = []
  for (const ct of Object.values(ChangeType)) {
    byCategory[ct] = []
  }
  changes.map(c => byCategory[c.accept(categorizer)].push(c))
  return byCategory
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

export const createReport = (
  oldArtifactsFolder: string, 
  newArtifactsFolder: string, 
  exclude: string,
  categorizer: Categorizer,
  logFunction: (msg: string) => void): ASTBackwardReport => {
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

  const byChangeType = categorize(
    report.codeReport.changes, 
     categorizer
  )
  report.major = byChangeType[ChangeType.Major]
  report.minor = byChangeType[ChangeType.Minor]
  report.patch = byChangeType[ChangeType.Patch]
  report.versionDelta = deltaFromChanges(
    report.storage.length > 0,
    report.major.length > 0,
    report.minor.length > 0,
    report.patch.length > 0
  )
  logFunction("Done\n")
  return report
}
