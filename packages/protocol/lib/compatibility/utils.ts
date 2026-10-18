import { BuildArtifacts } from '@celo/protocol/lib/compatibility/build-artifacts'
import { compilerFamily } from '@celo/protocol/lib/compatibility/internal'
import { reportASTIncompatibilities } from '@celo/protocol/lib/compatibility/ast-code';
import { reportLayoutIncompatibilities } from '@celo/protocol/lib/compatibility/ast-layout';
import { Categorizer } from '@celo/protocol/lib/compatibility/categorizer';
import { reportLibraryLinkingIncompatibilities } from '@celo/protocol/lib/compatibility/library-linking';
import { ASTDetailedVersionedReport, ASTReports } from '@celo/protocol/lib/compatibility/report';
import { linkedLibraries } from '@celo/protocol/lib/linked-libraries';
import { readJsonSync } from 'fs-extra';
import { globSync } from 'glob'

/**
 * Backward compatibility report, based on both the abstract syntax tree analysis of
 * both the storage layout, and code API.
 */
export class ASTBackwardReport {

  static create = (
    oldArtifactsFolders: string[],
    newArtifactsFolders: string[],
    oldArtifacts: BuildArtifacts[],
    newArtifacts: BuildArtifacts[],
    exclude: RegExp,
    categorizer: Categorizer,
    logFunction: (msg: string) => void): ASTBackwardReport => {

    // Run reports
    logFunction("Running storage report...\n")
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
      oldArtifactsFolders,
      newArtifactsFolders,
      exclude.toString(),
      versionedReport)
  }

  constructor(
    public readonly oldArtifactsFolder: string[],
    public readonly newArtifactsFolder: string[],
    public readonly exclude: string,
    public readonly report: ASTDetailedVersionedReport
  ) { }
}

// An artifact built without an AST falls back to the compilation target recorded in its
// metadata for the source path.
export function artifactSourcePath(artifact: any): string {
  if (artifact.ast && artifact.ast.absolutePath) {
    return artifact.ast.absolutePath
  }
  const target = artifact.metadata && artifact.metadata.settings && artifact.metadata.settings.compilationTarget
  return target ? Object.keys(target)[0] : ''
}

function listForgeBuildArtifacts(buildDirectory: string): string[] {
  const buildInfoPathPattern = /build-info/
  const coreContractPathPattern = /contracts(-0\.[58])?\//
  const nonFoundryDependencyPathPattern = /lib\/(?!celo)/
  const foundryTestContractPathPattern = /test-ts\//
  const pathPatterns = [ coreContractPathPattern, nonFoundryDependencyPathPattern, foundryTestContractPathPattern ]
  const artifactsGlobPattern = `${buildDirectory}/**/*.json`
  const allArtifactPaths = globSync(artifactsGlobPattern)
  const coreContracts = allArtifactPaths.filter(artifactPath => {
    if (artifactPath.match(buildInfoPathPattern)) {
      return false
    }
    const artifact = readJsonSync(artifactPath)
    const sourcePath = artifactSourcePath(artifact)
    return pathPatterns.some((pattern: RegExp) => sourcePath.match(pattern))
  })

  return coreContracts
}

interface CompilerArtifactsIndex {
  [index: string]: string[]
}

// A source file declaring only file-level types or functions gets an artifact with its AST
// but no metadata, so neither its compiler nor a contract to compare is known.
const isSourceOnly = (artifact: any): boolean => !artifact.metadata || !artifact.metadata.compiler

function splitArtifactsByCompiler(artifactPaths: string[]): CompilerArtifactsIndex {
  const artifactsIndex: CompilerArtifactsIndex = {}
  artifactPaths.forEach(artifactPath => {
    const artifact = readJsonSync(artifactPath)
    if (isSourceOnly(artifact)) {
      return
    }
    const family = compilerFamily(artifact.metadata.compiler.version)
    if (!artifactsIndex[family]) {
      artifactsIndex[family] = []
    }
    artifactsIndex[family].push(artifactPath)
  })

  return artifactsIndex
}

export function instantiateArtifactsFromForge(buildDirectory: string): BuildArtifacts[] {
  const artifactPaths = listForgeBuildArtifacts(buildDirectory)
  const artifactsIndex: CompilerArtifactsIndex = splitArtifactsByCompiler(artifactPaths)
  // Source-only artifacts hold no contract to report on, but contracts of any compiler may
  // import the types they declare, so every set can resolve imports through them.
  const sourceOnlyPaths = artifactPaths.filter(artifactPath => isSourceOnly(readJsonSync(artifactPath)))
  return Object.keys(artifactsIndex).map(
    compiler => new BuildArtifacts(artifactsIndex[compiler], sourceOnlyPaths)
  )
}

/**
 * Build output directory forge writes a ref's artifacts to (mirrors build_dir_for_ref in
 * scripts/bash/release-lib.sh). Branch names may contain slashes, which are flattened to
 * underscores so the directory is a single path segment.
 */
export function buildDirectoryForRef(ref: string, profile?: string): string {
  const base = `./out-${ref.replace(/\//g, '_')}`
  return profile ? `${base}-${profile}` : base
}
