import { readJsonSync } from 'fs-extra'

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
    artifactsPaths.forEach((path) => {
      const artifact = readJsonSync(path)
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
    return this.listArtifacts().find((artifact) => artifact.contractName === name)
  }

  getArtifactsFromSourcePath(sourcePath: string): any[] {
    return this.sourcesToArtifacts[sourcePath] || []
  }
}
