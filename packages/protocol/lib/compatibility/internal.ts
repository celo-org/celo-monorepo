import { existsSync } from 'fs'
import { BuildArtifacts } from '@celo/protocol/lib/compatibility/build-artifacts'
import { artifactSourcePath } from '@celo/protocol/lib/compatibility/utils'

// Foundry build artifacts do not have a `.contractName` field, so we get it from the
// `ContractDefinition` expression in the AST.
const getContractNameFromDefinition = (artifact: Artifact): string => {
  for (let i = 0; i < artifact.ast.nodes.length; i++) {
    const node = artifact.ast.nodes[i]
    if (node.nodeType === 'ContractDefinition') {
      return node.name
    }
  }
  console.error("Name not found in artifact AST")
  return ''
}

export const getContractName = (artifact: Artifact): string => {
  if (artifact.contractName) {
    return artifact.contractName
  } else {
    return getContractNameFromDefinition(artifact)
  }
}

export const getArtifactByName = (contractName: string, artifacts: BuildArtifacts): Artifact => {
  const matches = artifacts.listArtifacts().filter(artifact =>
    getContractName(artifact) === contractName
  )
  if (matches.length <= 1) {
    return matches[0]
  }
  // Multiple contracts share this name (e.g. Celo's ReentrancyGuard in contracts/ vs
  // OpenZeppelin's ReentrancyGuard under lib/). Prefer the project contract so name
  // resolution is deterministic across the baseline and new builds; otherwise the
  // first-match ordering can differ between builds and produce phantom storage diffs.
  const projectMatch = matches.find(artifact => {
    const sourcePath = artifactSourcePath(artifact)
    return /(^|\/)contracts(-0\.[58])?\//.test(sourcePath) && !/(^|\/)lib\//.test(sourcePath)
  })
  return projectMatch || matches[0]
}

export const getBytecode = (artifact: Artifact): string => {
  if (typeof artifact.bytecode === "string") {
    return artifact.bytecode
  } else {
    return artifact.bytecode.object
  }
}

export const getDeployedBytecode = (artifact: Artifact): string => {
  if (typeof artifact.deployedBytecode === "string") {
    return artifact.deployedBytecode
  } else {
    return artifact.deployedBytecode.object
  }
}

export const getSourceFile = (artifact: Artifact): string => {
  if (typeof (artifact as any).metadata === "object") {
    return Object.keys((artifact as any).metadata.sources)[0]
  } else {
    throw new Error("Artifact does not have metadata")
  }
}

// The link references of an artifact's deployed bytecode, if it links any library.
export const getDeployedLinkReferences = (artifact: Artifact): LinkReferences | undefined =>
  typeof artifact.deployedBytecode === "string" ? undefined : artifact.deployedBytecode.linkReferences

/**
 * Replaces every unlinked-library placeholder in a bytecode with a token derived from
 * the library's name alone.
 *
 * solc derives the placeholder from the fully qualified name (source path and library
 * name), so moving a library file, as the single-tree layout did, changes the bytecode
 * of every contract linking it although nothing compiled differently. Two builds that
 * link the same library names then compare equal; a contract switching to another
 * library still shows up.
 */
export const normalizeLinkPlaceholders = (bytecode: string, linkReferences: LinkReferences | undefined): string => {
  if (!linkReferences) {
    return bytecode
  }
  let normalized = bytecode
  Object.values(linkReferences).forEach((libraries) => {
    Object.entries(libraries).forEach(([library, references]) => {
      const token = `__$${library.padEnd(34, '_').slice(0, 34)}$__`
      references.forEach(({ start, length }) => {
        // offsets are bytes into the code; the string carries a 0x prefix
        const from = 2 + start * 2
        normalized = normalized.slice(0, from) + token + normalized.slice(from + length * 2)
      })
    })
  })
  return normalized
}

export interface LinkReference {
  start: number
  length: number
}

export interface LibraryLinkReference {
  [library: string]: LinkReference[]
}

export interface LinkReferences {
  [sourcePath: string]: LibraryLinkReference
}

// A contract's compiler artifact.
export interface Artifact {
  abi: any[]
  ast: any
  bytecode: (string | { object: string, linkReferences: LinkReferences })
  compiler: any
  contractName: string
  deployedBytecode: (string | { object: string, linkReferences: LinkReferences })
  deployedSourceMap: string
  fileName: string
  legacyAST?: any
  metadata?: { compiler?: { version?: string } } // Foundry artifact metadata
  networks: any
  schemaVersion: string
  source: string
  sourceMap: string
  sourcePath: string
  updatedAt: string
}

/**
 * The part of a solc version that decides whether two builds are comparable: the language
 * generation (0.5 vs 0.8), not the patch release. A release compiled with a newer 0.8.x
 * than the previous one must still be compared contract by contract, so artifact sets are
 * keyed and matched by this family.
 */
export function compilerFamily(version: string): string {
  const match = /^(\d+)\.(\d+)/.exec(version)
  return match ? `${match[1]}.${match[2]}` : version
}

export interface BuildDirectories {
  buildDir05: string
  buildDir08: string
}

/**
 * Locates a ref's 0.5 and 0.8 build directories next to the base directory the release
 * scripts build it into (`./out-<ref>`, see build_dir_for_ref in release-lib.sh).
 * Pre-migration tags build their 0.5 implementations with the truffle-compat profile and
 * the single tree builds contracts-0.5 (the proxies) with solc05. Refs that still define
 * the truffle-compat8 profile build their 0.8 sources into its own directory; the unified
 * layout builds them with the default profile into the base directory itself.
 */
export function resolveBuildDirectories(
  base: string,
  exists: (path: string) => boolean = existsSync
): BuildDirectories {
  const buildDir05 = exists(`${base}-truffle-compat`) ? `${base}-truffle-compat` : `${base}-solc05`
  const buildDir08 = exists(`${base}-truffle-compat8`) ? `${base}-truffle-compat8` : base
  return { buildDir05, buildDir08 }
}
