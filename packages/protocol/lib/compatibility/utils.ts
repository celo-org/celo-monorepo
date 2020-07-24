import { reportASTIncompatibilities } from '@celo/protocol/lib/compatibility/ast-code'
import { reportLayoutIncompatibilities } from '@celo/protocol/lib/compatibility/ast-layout'
import { Categorizer } from '@celo/protocol/lib/compatibility/categorizer'
import { ASTDetailedVersionedReport, ASTReports } from '@celo/protocol/lib/compatibility/report'
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
    // Run reports
    logFunction("Running storage report...")
    const storage = reportLayoutIncompatibilities(artifacts1, artifacts2)
    logFunction("Done\n")
    logFunction("Running code report...")
    const code = reportASTIncompatibilities(artifacts1, artifacts2)
    logFunction("Done\n")
  
    const excludeRegexp: RegExp = exclude ? new RegExp(exclude) : null
    const fullReports = new ASTReports(code, storage).excluding(excludeRegexp)
    
    logFunction("Generating backward report...")
    const versionedReport = ASTDetailedVersionedReport.create(fullReports, categorizer)
    logFunction("Done\n")
    
    return new ASTBackwardReport(
      oldArtifactsFolder,
      newArtifactsFolder,
      exclude,
      versionedReport)
  }

  constructor(
    public readonly oldArtifactsFolder: string,
    public readonly newArtifactsFolder: string,
    public readonly exclude: string,
    public readonly report: ASTDetailedVersionedReport
  ) {}
}

function ensureValidArtifacts(artifactsPaths: string[]): void {
  artifactsPaths.forEach((path) => {
    const artifact = readJsonSync(path)
    if (artifact.ast === undefined) {
      console.error(`ERROR: invalid artifact file found: '${path}'`)
      process.exit(10001)
    }
  })
}

export function instantiateArtifacts(buildDirectory: string): BuildArtifacts {
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
