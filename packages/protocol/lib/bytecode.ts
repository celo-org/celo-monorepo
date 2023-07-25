// tslint:disable: max-classes-per-file
/*
 * The Solidity compiler appends a Swarm Hash of compilation metadata to the end
 * of bytecode. We find this hash based on the specification here:
 * https://solidity.readthedocs.io/en/develop/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
 */

import { NULL_ADDRESS, trimLeading0x } from '@celo/base/lib/address'

const CONTRACT_METADATA_REGEXPS = [
  // 0.5.8
  'a165627a7a72305820.{64}0029',
  // 0.5.13
  'a265627a7a72315820.{64}64736f6c6343.{6}0032',

  'a264697066735822.{64}64736f6c6343.{6}0033',
  
  'a264697066735822.{68}64736f6c6343.{6}0033'
]

const GENERAL_METADATA_REGEXP = new RegExp(
  `^(.*)(${CONTRACT_METADATA_REGEXPS.map((r) => '(' + r + ')').join('|')})$`,
  'i' // Use i flag to make search case insensitive.
)

export const stripMetadata = (bytecode: string): string => {
  if (bytecode === '0x') {
    return '0x'
  }

  const match = bytecode.match(GENERAL_METADATA_REGEXP)
  if (match === null) {
    throw new Error(
      'Only support stripping metadata from bytecodes generated by solc up to v0.5.13 with no experimental features.'
    )
  }
  return match[1]
}

// Maps library names to their onchain addresses (formatted without "0x" prefix).
export interface LibraryLinks {
  [name: string]: string
}

/*
 * Unresolved libraries appear as "__LibraryName___..." in bytecode output by
 * solc. The length of the entire string is 40 characters (accounting for the 20
 * bytes of the address that should be substituted in).
 */
const padForLink = (name: string): string => {
  return `__${name}`.padEnd(40, '_')
}

export const linkLibraries = (bytecode: string, libraryLinks: LibraryLinks): string => {
  Object.keys(libraryLinks).forEach((libraryName) => {
    const linkString = padForLink(libraryName)
    // Use g flag to iterate through for all occurences.
    bytecode = bytecode.replace(RegExp(linkString, 'g'), libraryLinks[libraryName])
  })

  return bytecode
}

const ADDRESS_LENGTH = 40
const PUSH20_OPCODE = '73'
// To check that a library isn't being called directly, the Solidity
// compiler starts a library's bytecode with a comparison of the current
// address with the address the library was deployed to (it has to differ
// to ensure the library is being called with CALLCODE or DELEGATECALL
// instead of a regular CALL).
// The address is only known at contract construction time, so
// the compiler's output contains a placeholder 0-address, while the onchain
// bytecode has the correct address inserted.
// Reference: https://solidity.readthedocs.io/en/v0.5.12/contracts.html#call-protection-for-libraries
export const verifyAndStripLibraryPrefix = (bytecode: string, address = NULL_ADDRESS) => {
  if (bytecode.slice(2, 4) !== PUSH20_OPCODE) {
    throw new Error(`Library bytecode doesn't start with address load`)
  } else if (bytecode.slice(4, 4 + ADDRESS_LENGTH) !== trimLeading0x(address).toLowerCase()) {
    throw new Error(`Library bytecode loads unexpected address at start`)
  }

  return bytecode.slice(4 + ADDRESS_LENGTH, bytecode.length)
}

export class LibraryPositions {
  static libraryLinkRegExpString = '__([A-Z][A-Za-z0-9]*)_{2,}'

  positions: { [library: string]: number[] }

  /*
   * Creates a LibraryPositions object, which, for each yet to be linked library,
   * contains the bytecode offsets of where the library address should be
   * inserted.
   */
  constructor(bytecode: string) {
    this.positions = {}
    // Use g flag to iterate through for all occurences.
    const libraryLinkRegExp = new RegExp(LibraryPositions.libraryLinkRegExpString, 'g')
    let match = libraryLinkRegExp.exec(bytecode)
    while (match != null) {
      // The first capture group is the library's name
      this.addPosition(match[1], match.index)
      match = libraryLinkRegExp.exec(bytecode)
    }
  }

  private addPosition(library: string, position: number) {
    if (!this.positions[library]) {
      this.positions[library] = []
    }

    this.positions[library].push(position)
  }
}

export class LibraryAddresses {
  addresses: { [library: string]: string }

  constructor() {
    this.addresses = {}
  }

  collect = (bytecode: string, libraryPositions: LibraryPositions) =>
    Object.keys(libraryPositions.positions).forEach((library) =>
      libraryPositions.positions[library].forEach((position) => {
        if (!this.addAddress(library, bytecode.slice(position, position + ADDRESS_LENGTH))) {
          throw new Error(`Mismatched addresses for ${library} at ${position}`)
        }
      })
    )

  /*
   * Tries to add a library name -> address mapping. If the library has already
   * had an address added, checks that the new address matches the old one.
   */
  private addAddress(library: string, address: string): boolean {
    if (!this.addresses[library]) {
      this.addresses[library] = address
    }
    console.log("this.addresses[library]", this.addresses[library])
    console.log("address", address)
    return this.addresses[library] === address
  }
}
