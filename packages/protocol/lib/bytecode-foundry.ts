/* eslint-disable max-classes-per-file: 0 */
/*
 * Foundry-specific bytecode utilities for handling library linking.
 * 
 * Foundry uses hashed library placeholders in the format __$<34-char-hex>$__
 * instead of Truffle's name-based placeholders __LibraryName_______________.
 * 
 * The hash is computed as: keccak256("sourcePath:LibraryName").substring(2, 36)
 */

import { TextEncoder } from 'util'
import { keccak256, toHex } from 'viem'

// Reuse metadata stripping from the original bytecode.ts
export { stripMetadata, verifyAndStripLibraryPrefix } from './bytecode'

// Maps library names to their onchain addresses (formatted without "0x" prefix).
export interface LibraryLinksFoundry {
  [name: string]: string
}

// Maps library names to their source file paths (needed for hash computation)
export interface LibrarySourcePaths {
  [name: string]: string
}

/**
 * Computes the Foundry library placeholder hash.
 * Hash = keccak256("sourcePath:libraryName").substring(2, 36)
 * 
 * @param sourcePath - The source file path (e.g., "contracts/common/linkedlists/IntegerSortedLinkedList.sol")
 * @param libraryName - The library name (e.g., "IntegerSortedLinkedList")
 * @returns 34-character hex string (without 0x prefix)
 */
export const computeFoundryLibraryHash = (sourcePath: string, libraryName: string): string => {
  const stringToHash = `${sourcePath}:${libraryName}`
  const hashed = keccak256(toHex(new TextEncoder().encode(stringToHash)))
  return hashed.substring(2, 2 + 34) // 34 chars
}

/**
 * Links libraries in Foundry bytecode by replacing hashed placeholders with addresses.
 * 
 * @param bytecode - The bytecode containing __$<hash>$__ placeholders
 * @param libraryLinks - Map of library names to their deployed addresses
 * @param librarySourcePaths - Map of library names to their source file paths
 * @returns Bytecode with placeholders replaced by addresses
 */
export const linkLibrariesFoundry = (
  bytecode: string,
  libraryLinks: LibraryLinksFoundry,
  librarySourcePaths: LibrarySourcePaths
): string => {
  let linkedBytecode = bytecode

  Object.keys(libraryLinks).forEach((libraryName) => {
    const sourcePath = librarySourcePaths[libraryName]
    if (!sourcePath) {
      console.warn(`Warning: No source path found for library ${libraryName}, skipping linking`)
      return
    }

    const placeholderHash = computeFoundryLibraryHash(sourcePath, libraryName)
    const placeholder = `__\\$${placeholderHash}\\$__`

    // Use g flag to replace all occurrences
    const regex = new RegExp(placeholder, 'g')
    linkedBytecode = linkedBytecode.replace(regex, libraryLinks[libraryName])
  })

  return linkedBytecode
}

const ADDRESS_LENGTH = 40

/**
 * Class for tracking positions of library placeholders in Foundry bytecode.
 * Uses linkReferences from Foundry artifacts directly instead of regex parsing.
 */
export class LibraryPositionsFoundry {
  // Maps placeholder hash to array of positions in bytecode
  positions: { [hash: string]: number[] }
  // Maps placeholder hash to library info (if known from artifacts)
  hashToLibrary: { [hash: string]: { name: string; sourcePath: string } }

  constructor() {
    this.positions = {}
    this.hashToLibrary = {}
  }

  /**
   * Register library information from artifact's linkReferences.
   * @param libraryName - Name of the library
   * @param sourcePath - Source file path (e.g., "contracts-0.8/common/linkedlists/AddressLinkedList.sol")
   * @param positions - Array of positions from linkReferences (e.g., [{"start":10182,"length":20}, ...])
   */
  registerLibraryFromLinkReferences(
    libraryName: string,
    sourcePath: string,
    positions: Array<{ start: number; length: number }>
  ) {
    const hash = computeFoundryLibraryHash(sourcePath, libraryName)

    // Convert positions from linkReferences format (start/length) to just start positions
    // In bytecode, we need character positions, and linkReferences gives byte positions
    // For hex strings, 1 byte = 2 characters, but we also have the "0x" prefix
    const bytePositions = positions.map(pos => {
      // Remove "0x" prefix (2 chars) then convert byte position to char position
      return pos.start * 2 + 2
    })

    this.positions[hash] = bytePositions
    this.hashToLibrary[hash] = { name: libraryName, sourcePath }
  }

  /**
   * Get library name from hash (if registered)
   */
  getLibraryName(hash: string): string | undefined {
    return this.hashToLibrary[hash]?.name
  }

  /**
   * Get all library names found in linkReferences
   */
  getLibraryNames(): string[] {
    return Object.keys(this.hashToLibrary).map((hash) => this.hashToLibrary[hash].name)
  }
}

/**
 * Class for collecting and managing library addresses from deployed bytecode.
 * Works with Foundry's hashed placeholders.
 */
export class LibraryAddressesFoundry {
  addresses: { [library: string]: string }
  sourcePaths: { [library: string]: string }

  constructor() {
    this.addresses = {}
    this.sourcePaths = {}
  }

  /**
   * Collect library addresses from deployed bytecode by matching against expected positions.
   * 
   * @param bytecode - The deployed bytecode containing actual library addresses
   * @param libraryPositions - The positions where library addresses should appear
   */
  collect = (bytecode: string, libraryPositions: LibraryPositionsFoundry) => {
    console.log(`\n=== Collecting library addresses from bytecode ===`)
    console.log(`Bytecode length: ${bytecode.length}`)
    console.log(`Hashes to process: ${Object.keys(libraryPositions.positions).length}`)

    Object.keys(libraryPositions.positions).forEach((hash) => {
      const libraryInfo = libraryPositions.hashToLibrary[hash]
      if (!libraryInfo) {
        console.warn(`Warning: No library info found for hash ${hash}`)
        return
      }

      console.log(`\nProcessing library: ${libraryInfo.name}`)
      console.log(`  Source path: ${libraryInfo.sourcePath}`)
      console.log(`  Hash: ${hash}`)
      console.log(`  Positions to check: ${libraryPositions.positions[hash].join(', ')}`)

      libraryPositions.positions[hash].forEach((position, index) => {
        const address = bytecode.slice(position, position + ADDRESS_LENGTH)
        console.log(`  Position ${position} (${index + 1}/${libraryPositions.positions[hash].length}): ${address}`)

        if (!this.addAddress(libraryInfo.name, address, libraryInfo.sourcePath)) {
          const existingAddress = this.addresses[libraryInfo.name]
          const existingPath = this.sourcePaths[libraryInfo.name]
          console.error(`\n❌ MISMATCH DETECTED:`)
          console.error(`  Library: ${libraryInfo.name}`)
          console.error(`  Position: ${position}`)
          console.error(`  Expected address: ${existingAddress}`)
          console.error(`  Expected source: ${existingPath}`)
          console.error(`  Found address: ${address}`)
          console.error(`  Found source: ${libraryInfo.sourcePath}`)
          throw new Error(`Mismatched addresses for ${libraryInfo.name} at ${position}`)
        } else {
          console.log(`    ✓ Address accepted: ${address}`)
        }
      })
    })

    console.log(`\n=== Collection complete ===`)
    console.log(`Total libraries collected: ${Object.keys(this.addresses).length}`)
  }

  /**
   * Tries to add a library name -> address mapping. If the library already has
   * an address, checks that the new address matches the old one.
   */
  private addAddress(library: string, address: string, sourcePath: string): boolean {
    if (!this.addresses[library]) {
      this.addresses[library] = address
      this.sourcePaths[library] = sourcePath
    }
    return this.addresses[library] === address
  }
}

