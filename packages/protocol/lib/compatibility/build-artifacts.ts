import { getContractName } from '@celo/protocol/lib/compatibility/internal'
import { readJsonSync } from 'fs-extra'
import path from 'path'

/**
 * The contract an artifact file describes. Foundry writes `<Source>.sol/<Contract>.json`,
 * or `<Contract>.<solc version>.json` when a build compiles it with several compilers,
 * and puts no contract name inside. The file name is the only reliable source: all
 * contracts of one source file share that file's AST.
 */
export const contractNameFromArtifactPath = (artifactPath: string): string =>
  path.basename(artifactPath, '.json').replace(/\.\d+\.\d+\.\d+$/, '')

/**
 * The compiler version Foundry puts in an artifact's file name when it compiled the source
 * with several compilers (`<Name>.<solc version>.json`), undefined when it used only one.
 */
export const compilerVersionFromArtifactPath = (artifactPath: string): string | undefined => {
  const match = /\.(\d+\.\d+\.\d+)$/.exec(path.basename(artifactPath, '.json'))
  return match ? match[1] : undefined
}

/**
 * The compiler artifacts of one build, indexed by the source file that produced them.
 *
 * Same contract as the BuildArtifacts class of the retired @openzeppelin/upgrades SDK,
 * which the compatibility tooling was written against: artifacts are grouped by the
 * `ast.absolutePath` of their source unit, and every contract of a file shares that
 * file's AST.
 */
export class BuildArtifacts {
  private readonly sourcesToArtifacts: { [sourcePath: string]: any[] } = {}
  // ASTs of source files that declare no contract, only used to resolve imports.
  private readonly sourceOnlyArtifacts: { [sourcePath: string]: any[] } = {}

  constructor(artifactsPaths: string[], sourceOnlyPaths: string[] = []) {
    sourceOnlyPaths.forEach((artifactPath) => {
      const artifact = readJsonSync(artifactPath)
      // Source-only artifacts carry no metadata; the file name is all that tells which
      // compiler run produced them.
      artifact.sourceOnlyCompilerVersion = compilerVersionFromArtifactPath(artifactPath)
      const sourcePath = artifact.ast.absolutePath
      if (!this.sourceOnlyArtifacts[sourcePath]) {
        this.sourceOnlyArtifacts[sourcePath] = []
      }
      this.sourceOnlyArtifacts[sourcePath].push(artifact)
    })
    artifactsPaths.forEach((artifactPath) => {
      const artifact = readJsonSync(artifactPath)
      if (!artifact.contractName) {
        artifact.contractName = contractNameFromArtifactPath(artifactPath)
      }
      const sourcePath = artifact.ast.absolutePath
      if (!this.sourcesToArtifacts[sourcePath]) {
        this.sourcesToArtifacts[sourcePath] = []
      }
      this.sourcesToArtifacts[sourcePath].push(artifact)
    })
  }

  listSourcePaths(): string[] {
    return Object.keys(this.sourcesToArtifacts)
  }

  listArtifacts(): any[] {
    return ([] as any[]).concat(...Object.values(this.sourcesToArtifacts))
  }

  getArtifactByName(name: string): any {
    return this.listArtifacts().find((artifact) => getContractName(artifact) === name)
  }

  getArtifactsFromSourcePath(sourcePath: string): any[] {
    return [
      ...(this.sourcesToArtifacts[sourcePath] || []),
      ...(this.sourceOnlyArtifacts[sourcePath] || []),
    ]
  }
}
