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
 * The compiler artifacts of one build, indexed by the source file that produced them.
 *
 * Same contract as the BuildArtifacts class of the retired @openzeppelin/upgrades SDK,
 * which the compatibility tooling was written against: artifacts are grouped by the
 * `ast.absolutePath` of their source unit, and every contract of a file shares that
 * file's AST.
 */
export class BuildArtifacts {
  private readonly sourcesToArtifacts: { [sourcePath: string]: any[] } = {}

  constructor(artifactsPaths: string[]) {
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
    return this.sourcesToArtifacts[sourcePath] || []
  }
}
