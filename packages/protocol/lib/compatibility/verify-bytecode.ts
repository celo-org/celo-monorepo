interface LibraryPositions {
  [library: string]: number[]
}

const addPosition = (positions: LibraryPositions, library: string, position: number) => {
  if (!positions[library]) {
    positions[library] = []
  }

  positions[library].push(position)
}

interface LibraryAddresses {
  [library: string]: string
}

/*
 * Tries to add a library name -> address mapping to a LibraryAddresses object.
 * If the library has already had an address added, checks that the new address
 * matches the old one.
 */
const addAddress = (addresses: LibraryAddresses, library: string, address: string): boolean => {
  if (!addresses[library]) {
    addresses[library] = address
  } else if (addresses[library] !== address) {
    return false
  }
  return true
}

const libraryLinkRegExpString = '__([A-Z][A-Za-z0-9]*)_{2,}'

/*
 * Returns a LibraryPositions object, which, for each yet to be linked library,
 * contains the bytecode offsets of where the library address should be
 * inserted.
 */
export const collectLibraryPositions = (bytecode: string): LibraryPositions => {
  const libraryLinkRegExp = new RegExp(libraryLinkRegExpString, 'g')
  const libraryPositions: LibraryPositions = {}
  let match = libraryLinkRegExp.exec(bytecode)
  while (match != null) {
    // The firt capture group is the library's name
    addPosition(libraryPositions, match[1], match.index)
    match = libraryLinkRegExp.exec(bytecode)
  }

  return libraryPositions
}

export const collectLibraryAddresses = (bytecode: string, libraryPositions: LibraryPositions): LibraryAddresses => {
  const libraryAddresses: LibraryAddresses = {}
  Object.keys(libraryPositions).forEach(library => {
    libraryPositions[library].forEach(position => {
      if (!addAddress(libraryAddresses, library, bytecode.slice(position, position + 40))) {
        throw new Error(`Mismatched addresses for ${library} at ${position}`)
      }
    })
  })
  return libraryAddresses
}
