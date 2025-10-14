/*
 * Utilities for loading and parsing Foundry build artifacts.
 * 
 * Foundry organizes artifacts differently from Truffle:
 * - Location: out/<ContractName>.sol/<ContractName>.json
 * - Structure: { bytecode: { object }, deployedBytecode: { object }, metadata: { sources } }
 */

import { existsSync, readJsonSync, readdirSync } from 'fs-extra'
import { basename, join } from 'path'
import { ForgeArtifact } from '../scripts/foundry/ForgeArtifact'
import { computeFoundryLibraryHash } from './bytecode-foundry'

export interface FoundryArtifact {
  contractName: string
  deployedBytecode: string
  bytecode: string
  abi: any[]
  metadata: {
    sources: {
      [sourcePath: string]: any
    }
    compiler?: {
      version?: string
    }
  }
}

export interface FoundryBuildArtifacts {
  artifacts: Map<string, FoundryArtifact>

  /**
   * Directory where these artifacts were loaded from
   */
  directory: string

  /**
   * Get artifact by contract name
   */
  getArtifactByName(contractName: string): FoundryArtifact | undefined

  /**
   * Get raw Foundry artifact (with linkReferences, etc.)
   */
  getRawArtifact(contractName: string): any

  /**
   * List all contract names
   */
  listArtifacts(): Array<{ contractName: string }>

  /**
   * Find source file path for a contract
   */
  getSourcePath(contractName: string): string | undefined

  /**
   * Get library dependencies with their source paths
   */
  getLibraryDependencies(contractName: string): Map<string, string>

  /**
   * Get all contract names in this artifact set
   */
  getAllContractNames(): string[]
}

/**
 * Implementation of FoundryBuildArtifacts
 */
class FoundryBuildArtifactsImpl implements FoundryBuildArtifacts {
  artifacts: Map<string, FoundryArtifact>
  directory: string
  private contractToSourcePath: Map<string, string>
  private rawArtifacts: Map<string, any>

  constructor(directory: string) {
    this.artifacts = new Map()
    this.directory = directory
    this.contractToSourcePath = new Map()
    this.rawArtifacts = new Map()
  }

  getArtifactByName(contractName: string): FoundryArtifact | undefined {
    return this.artifacts.get(contractName)
  }

  listArtifacts(): Array<{ contractName: string }> {
    return Array.from(this.artifacts.keys()).map((contractName) => ({ contractName }))
  }

  getSourcePath(contractName: string): string | undefined {
    return this.contractToSourcePath.get(contractName)
  }

  getLibraryDependencies(contractName: string): Map<string, string> {
    const artifact = this.artifacts.get(contractName)
    if (!artifact) {
      return new Map()
    }

    const dependencies = new Map<string, string>()

    // First, try to get library dependencies from Foundry's linkReferences in the raw artifact
    // This is more reliable than parsing bytecode
    const rawArtifact = this.getRawArtifact(contractName)
    if (rawArtifact?.bytecode?.linkReferences) {
      // linkReferences format: { "sourcePath": { "LibraryName": [...offsets] } }
      for (const sourcePath of Object.keys(rawArtifact.bytecode.linkReferences)) {
        for (const libraryName of Object.keys(rawArtifact.bytecode.linkReferences[sourcePath])) {
          dependencies.set(libraryName, sourcePath)
        }
      }
    }

    // Also check deployedBytecode linkReferences
    if (rawArtifact?.deployedBytecode?.linkReferences) {
      for (const sourcePath of Object.keys(rawArtifact.deployedBytecode.linkReferences)) {
        for (const libraryName of Object.keys(rawArtifact.deployedBytecode.linkReferences[sourcePath])) {
          dependencies.set(libraryName, sourcePath)
        }
      }
    }

    // If we didn't find linkReferences, fall back to parsing bytecode hashes
    if (dependencies.size === 0) {
      const bytecode = artifact.deployedBytecode

      // Look for library placeholders in the bytecode
      const libraryPlaceholderRegex = /__\$([a-f0-9]{34})\$__/g
      let match = libraryPlaceholderRegex.exec(bytecode)

      // Get all source files from metadata
      const sourcePaths = Object.keys(artifact.metadata?.sources || {})

      while (match != null) {
        const hash = match[1]

        // Try to find which library this hash corresponds to
        // by checking all possible combinations of source paths and contract names
        for (const sourcePath of sourcePaths) {
          // Extract potential library name from source path
          const fileName = basename(sourcePath, '.sol')

          // Check if this combination produces the hash
          const computedHash = computeFoundryLibraryHash(sourcePath, fileName)
          if (computedHash === hash) {
            dependencies.set(fileName, sourcePath)
            break
          }
        }

        match = libraryPlaceholderRegex.exec(bytecode)
      }
    }

    return dependencies
  }

  getRawArtifact(contractName: string): any {
    return this.rawArtifacts.get(contractName)
  }

  addRawArtifact(contractName: string, rawArtifact: any) {
    this.rawArtifacts.set(contractName, rawArtifact)
  }

  addArtifact(contractName: string, artifact: FoundryArtifact, sourcePath?: string) {
    this.artifacts.set(contractName, artifact)
    if (sourcePath) {
      this.contractToSourcePath.set(contractName, sourcePath)
    }
  }

  getAllContractNames(): string[] {
    return Array.from(this.artifacts.keys()).sort()
  }
}

/**
 * Recursively finds all Foundry artifact JSON files in a directory.
 * Foundry uses the structure: out/<ContractName>.sol/<ContractName>.json
 */
function findFoundryArtifacts(baseDir: string): Map<string, string> {
  const artifactPaths = new Map<string, string>()

  if (!existsSync(baseDir)) {
    console.warn(`Warning: Foundry output directory does not exist: ${baseDir}`)
    return artifactPaths
  }

  const entries = readdirSync(baseDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(baseDir, entry.name)

    if (entry.isDirectory()) {
      // Foundry creates directories like "ContractName.sol"
      if (entry.name.endsWith('.sol')) {
        // Look for JSON files inside
        const contractDir = fullPath
        const filesInDir = readdirSync(contractDir, { withFileTypes: true })

        for (const file of filesInDir) {
          if (file.isFile() && file.name.endsWith('.json')) {
            const contractName = basename(file.name, '.json')
            const artifactPath = join(contractDir, file.name)

            // Verify it's a valid artifact (has abi and bytecode)
            try {
              const content = readJsonSync(artifactPath)
              if (content.abi && content.bytecode) {
                artifactPaths.set(contractName, artifactPath)
              }
            } catch (e) {
              // Skip invalid JSON files
            }
          }
        }
      } else {
        // Recursively search subdirectories
        const subArtifacts = findFoundryArtifacts(fullPath)
        subArtifacts.forEach((path, name) => artifactPaths.set(name, path))
      }
    }
  }

  return artifactPaths
}

/**
 * Loads Foundry build artifacts from a directory.
 * 
 * @param buildDir - Path to Foundry output directory (e.g., "out-truffle-compat")
 * @param debug - Enable debug logging (default: false)
 * @returns FoundryBuildArtifacts instance with loaded artifacts
 */
export function getFoundryBuildArtifacts(buildDir: string, debug: boolean = false): FoundryBuildArtifacts {
  const result = new FoundryBuildArtifactsImpl(buildDir)
  const artifactPaths = findFoundryArtifacts(buildDir)

  artifactPaths.forEach((artifactPath, contractName) => {
    try {
      const rawArtifact: ForgeArtifact = readJsonSync(artifactPath)

      // Extract deployed bytecode - Foundry uses deployedBytecode.object
      let deployedBytecode = ''
      if (typeof rawArtifact.deployedBytecode === 'string') {
        deployedBytecode = rawArtifact.deployedBytecode
      } else if (rawArtifact.deployedBytecode?.object) {
        deployedBytecode = rawArtifact.deployedBytecode.object
      }

      // Extract creation bytecode
      let bytecode = ''
      if (typeof rawArtifact.bytecode === 'string') {
        bytecode = rawArtifact.bytecode
      } else if (rawArtifact.bytecode?.object) {
        bytecode = rawArtifact.bytecode.object
      }

      // Try to determine source path from metadata
      let sourcePath: string | undefined
      if (rawArtifact.metadata?.sources) {
        const sources = Object.keys(rawArtifact.metadata.sources)
        // Find the source file that matches the contract name
        sourcePath = sources.find((path) => path.includes(`${contractName}.sol`)) || sources[0]
      }

      const artifact: FoundryArtifact = {
        contractName,
        deployedBytecode,
        bytecode,
        abi: rawArtifact.abi || [],
        metadata: rawArtifact.metadata || { sources: {} },
      }

      result.addArtifact(contractName, artifact, sourcePath)
      result.addRawArtifact(contractName, rawArtifact)
    } catch (error) {
      console.warn(`Warning: Failed to load artifact for ${contractName}: ${error}`)
    }
  })

  if (debug) {
    const contractNames = Array.from(result.artifacts.keys()).sort()
    console.log(`\n📦 Loaded ${contractNames.length} artifacts from ${buildDir}`)
    console.log(`   Contracts: ${contractNames.slice(0, 10).join(', ')}${contractNames.length > 10 ? `, ... and ${contractNames.length - 10} more` : ''}`)
  }

  return result
}

/**
 * Loads artifacts from multiple Foundry build directories.
 * Useful for loading both solc 0.5 and 0.8 artifacts together.
 * 
 * @param buildDirs - Array of build directory paths
 * @returns Combined FoundryBuildArtifacts
 */
export function getFoundryBuildArtifactsMultiple(buildDirs: string[]): FoundryBuildArtifacts[] {
  return buildDirs.map((dir) => getFoundryBuildArtifacts(dir))
}

