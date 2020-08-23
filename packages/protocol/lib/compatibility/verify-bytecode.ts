import { linkLibraries, stripMetadata } from '@celo/protocol/lib/bytecode'
import { ProxyInstance, RegistryInstance } from 'types'

import { BuildArtifacts, } from '@openzeppelin/upgrades'

import Web3 from 'web3'

const Proxy: Truffle.Contract<ProxyInstance> = artifacts.require('Proxy')

export interface LibraryPositions {
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

export const collectLibraryAddresses = (bytecode: string, libraryPositions: LibraryPositions, libraryAddresses: LibraryAddresses = {}): LibraryAddresses => {
  Object.keys(libraryPositions).forEach(library => {
    libraryPositions[library].forEach(position => {
      if (!addAddress(libraryAddresses, library, bytecode.slice(position, position + 40))) {
        throw new Error(`Mismatched addresses for ${library} at ${position}`)
      }
    })
  })
  return libraryAddresses
}

// TODO: check against known Proxy bytecodes
const isProxyBytecode = (_bytecode: string) => {
  return true
}

const isProxyAddress = async (address: string, web3: Web3): Promise<boolean> => {
  const bytecode = await web3.eth.getCode(address)
  return isProxyBytecode(bytecode)
}

const getRegisteredProxiedAddress = async (contract: string, registry: RegistryInstance, web3: Web3): Promise<string> => {
  const proxyAddress = await registry.getAddressForString(contract)
  return await getProxiedAddress(proxyAddress, web3)
}

const getProxiedAddress = async (address: string, web3: Web3): Promise<string> => {
  if (!isProxyAddress(address, web3)) {
    throw new Error(`The contract registered as ${contract} does not have bytecode recognized as a Proxy's bytecode`)
  }

  const proxy: ProxyInstance = await Proxy.at(web3.utils.toChecksumAddress(address))
  return await proxy._getImplementation()
}

const verifyLibraryPrefix = (bytecode: string, address: string) => {
  if (bytecode.slice(2, 4) !== '73') {
    throw new Error(`Library bytecode doesn't start with address load`)
  } else if (bytecode.slice(4, 44) !== address) {
    throw new Error(`Library bytecode loads unexpected address at start`)
  }
}

export const verifyBytecodesDfs = async (contracts: string[], artifacts: BuildArtifacts, registry: RegistryInstance, web3: Web3) => {
  const queue = [...contracts]
  const visited: Set<string> = new Set()
  const libraryAddresses: LibraryAddresses = {}
  contracts.forEach(contract => visited.add(contract))

  // Checks one contract's bytecode, adding any unvisited libraries to the DFS queue.
  const dfsStep = async (contract: string) => {
    const sourceBytecodeWithMetadata = artifacts.getArtifactByName(contract).deployedBytecode
    const sourceBytecode = stripMetadata(sourceBytecodeWithMetadata)
    const isLibrary = !contracts.includes(contract)

    let address
    // We get core contracts by looking them up in the registry and following
    // their Proxy.
    // We get libraries by collecting their Proxies' addresses during the DFS.
    // Core contracts are the ones passed into this function, all contracts
    // found during the DFS are libraries.
    if (isLibrary) {
      address = await getProxiedAddress(libraryAddresses[contract], web3)
    } else {
      address = await getRegisteredProxiedAddress(contract, registry, web3)
    }
    const onchainBytecodeWithMetadata = await web3.eth.getCode(address)
    const onchainBytecode = stripMetadata(onchainBytecodeWithMetadata)

    const sourceLibraryPositions = collectLibraryPositions(sourceBytecode)
    collectLibraryAddresses(onchainBytecode, sourceLibraryPositions, libraryAddresses)

    const linkedSourceBytecode = linkLibraries(sourceBytecode, libraryAddresses)

    // To check that a library isn't being called directly, the Solidity
    // compiler starts a library's bytecode with a comparison of the current
    // address with the address the library was deployed to (it has to differ
    // to ensure the library is being called with CALLCODE or DELEGATECALL
    // instead of a regular CALL).
    // The address is only known at contract construction time, so
    // the compiler's output contains a placeholder 0-address, while the onchain
    // bytecode has the correct address inserted.
    // Reference: https://solidity.readthedocs.io/en/v0.5.12/contracts.html#call-protection-for-libraries
    let normalizedSourceBytecode
    let normalizedOnchainBytecode
    if (isLibrary) {
      verifyLibraryPrefix(linkedSourceBytecode, '0000000000000000000000000000000000000000')
      verifyLibraryPrefix(onchainBytecode, address.slice(2, 42).toLowerCase())
      normalizedSourceBytecode = linkedSourceBytecode.slice(44, linkedSourceBytecode.length)
      normalizedOnchainBytecode = onchainBytecode.slice(44, onchainBytecode.length)
    } else {
      normalizedSourceBytecode = linkedSourceBytecode
      normalizedOnchainBytecode = onchainBytecode
    }

    if (normalizedSourceBytecode !== normalizedOnchainBytecode) {
      throw new Error(`${contract}'s onchain and compiled bytecodes do not match`)
    }

    Object.keys(sourceLibraryPositions).forEach(library => {
      if (!visited.has(library)) {
        queue.push(library)
        visited.add(library)
      }
    })
  }

  while (queue.length > 0) {
    const contract = queue.pop()
    await dfsStep(contract)
  }
}
