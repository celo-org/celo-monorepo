import { reportASTIncompatibilities } from '@celo/protocol/lib/compatibility/ast-code'
import { reportLayoutIncompatibilities } from '@celo/protocol/lib/compatibility/ast-layout'
import { Categorizer } from '@celo/protocol/lib/compatibility/categorizer'
import { reportLibraryLinkingIncompatibilities } from '@celo/protocol/lib/compatibility/library-linking'
import { ASTDetailedVersionedReport, ASTReports } from '@celo/protocol/lib/compatibility/report'
import { linkedLibraries } from '@celo/protocol/migrationsConfig'
import { BuildArtifacts, Contracts, getBuildArtifacts } from '@openzeppelin/upgrades'
import { readJsonSync } from 'fs-extra'



/**
 * Backward compatibility report, based on both the abstract syntax tree analysis of
 * both the storage layout, and code API.
 */
export class ASTBackwardReport {

  static create = (
    oldArtifactsFolder: string,
    newArtifactsFolders: string[],
    oldArtifacts: BuildArtifacts[],
    newArtifacts: BuildArtifacts[],
    exclude: RegExp,
    categorizer: Categorizer,
    logFunction: (msg: string) => void): ASTBackwardReport => {

    // Run reports
    logFunction("Running storage report...")
    const storage = reportLayoutIncompatibilities(oldArtifacts, newArtifacts)
    logFunction("Done\n")

    logFunction("Running code report...")
    const code = reportASTIncompatibilities(oldArtifacts, newArtifacts)
    logFunction("Done\n")

    logFunction("Running library linking...")
    const libraryLinking = reportLibraryLinkingIncompatibilities(linkedLibraries, code)
    logFunction("Done\n")

    const fullReports = new ASTReports(code, storage, libraryLinking).excluding(exclude)

    logFunction("Generating backward report...")
    const versionedReport = ASTDetailedVersionedReport.create(fullReports, newArtifacts, categorizer)
    logFunction("Done\n")

    return new ASTBackwardReport(
      oldArtifactsFolder,
      newArtifactsFolders,
      exclude.toString(),
      versionedReport)
  }

  constructor(
    public readonly oldArtifactsFolder: string,
    public readonly newArtifactsFolder: string[],
    public readonly exclude: string,
    public readonly report: ASTDetailedVersionedReport
  ) { }
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
