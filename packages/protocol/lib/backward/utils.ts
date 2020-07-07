import { reportASTIncompatibilities } from '@celo/protocol/lib/backward/ast-code'
import { reportLayoutIncompatibilities } from '@celo/protocol/lib/backward/ast-layout'
import { Categorizer } from '@celo/protocol/lib/backward/categorizer'
import { ASTReports, ASTVersionedReport } from '@celo/protocol/lib/backward/report'
import { BuildArtifacts, Contracts, getBuildArtifacts } from '@openzeppelin/upgrades'
import { readJsonSync } from 'fs-extra'

/**
 * Backward compatibility report, based on both the abstract syntax tree analysis of
 * both the storage layout, and code API.
 */
export class ASTBackwardReport {

  static create = (
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
    const storage = reportLayoutIncompatibilities(artifacts1, artifacts2)
    logFunction("Done\n")
    logFunction("Running code report...")
    const code = reportASTIncompatibilities(artifacts1, artifacts2)
    logFunction("Done\n")
  
    report.exclude = exclude
    const excludeRegexp: RegExp = exclude? new RegExp(exclude) : null
    const fullReports = new ASTReports(code, storage).excluding(excludeRegexp)
    
    logFunction("Generating backward report...")
    report.report = ASTVersionedReport.create(fullReports, categorizer)
  
    logFunction("Done\n")
    return report
  }

  // Artifacts comparison folders
  oldArtifactsFolder: string
  newArtifactsFolder: string

  exclude: string

  report: ASTVersionedReport
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
