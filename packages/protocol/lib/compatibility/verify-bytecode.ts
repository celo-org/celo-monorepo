import { linkLibraries, stripMetadata } from '@celo/protocol/lib/bytecode'
import { ProposalTx } from '@celo/protocol/scripts/truffle/make-release'
import { ProxyInstance, RegistryInstance } from 'types'

import { BuildArtifacts, } from '@openzeppelin/upgrades'

import Web3 from 'web3'

const ignoredContracts = [
  // This contract is not proxied
  'TransferWhitelist',

  // These contracts are not in the Registry (before release 1)
  'ReserveSpenderMultiSig',
  'GovernanceApproverMultiSig'
]

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

const verifyProxy = async (address: string, context: VerificationContext) => {
  const bytecode = await context.web3.eth.getCode(address)
  if (!isProxyBytecode(bytecode)) {
    throw new Error(`Expected ${address} to be a proxy address but it isn't`)
  }
}

const getRegisteredProxyAddress = (contract: string, context: VerificationContext): Promise<string> => {
  return context.registry.getAddressForString(contract)
}

const getProxiedAddress = async (address: string, context: VerificationContext): Promise<string> => {
  const proxy: ProxyInstance = await context.Proxy.at(context.web3.utils.toChecksumAddress(address))
  return proxy._getImplementation()
}

const verifyLibraryPrefix = (bytecode: string, address: string) => {
  if (bytecode.slice(2, 4) !== '73') {
    throw new Error(`Library bytecode doesn't start with address load`)
  } else if (bytecode.slice(4, 44) !== address) {
    throw new Error(`Library bytecode loads unexpected address at start`)
  }
}

interface VerificationContext {
  contracts: string[]
  artifacts: BuildArtifacts
  libraryAddresses: LibraryAddresses
  registry: RegistryInstance
  proposal: ProposalTx[]
  Proxy: Truffle.Contract<ProxyInstance>
  web3: Web3

  // TODO: remove this after first smart contracts release
  isBeforeRelease1: boolean
}

const isImplementationChanged = (contract: string, context: VerificationContext): boolean => {
  return context.proposal.some((tx: ProposalTx) => {
    return tx.contract === `${contract}Proxy` && tx.function === '_setImplementation'
  })
}

const isProxyChanged = (contract: string, context: VerificationContext): boolean => {
  const registryId = context.web3.utils.soliditySha3({ type: 'string', value: contract })
  return context.proposal.some((tx: ProposalTx) => {
    return tx.contract === `Registry` && tx.function === 'setAddressFor' && tx.args[0] === registryId
  })
}

const getProposedProxyAddress = (contract: string, context: VerificationContext): string => {
  const registryId = context.web3.utils.soliditySha3({ type: 'string', value: contract })
  const tx = context.proposal.find((tx: ProposalTx) => {
    return tx.contract === `Registry` && tx.function === 'setAddressFor' && tx.args[0] === registryId
  })

  return tx.args[1]
}

const getProposedImplementationAddress = (contract: string, context: VerificationContext): string => {
  const tx = context.proposal.find((tx: ProposalTx) => {
    return tx.contract === `${contract}Proxy`
  })

  return tx.args[0]
}

const getSoureBytecode = (contract: string, context: VerificationContext): string => {
  const sourceBytecodeWithMetadata = context.artifacts.getArtifactByName(contract).deployedBytecode
  return stripMetadata(sourceBytecodeWithMetadata)
}

const getLibraryAddress = async (contract: string, context: VerificationContext): Promise<string> => {
  const proxyAddress = context.libraryAddresses[contract]
  await verifyProxy(proxyAddress, context)

  if (isImplementationChanged(contract, context)) {
    return getProposedImplementationAddress(contract, context)
  } else {
    return getProxiedAddress(proxyAddress, context)
  }
}

const getCoreContractAddress = async (contract: string, context: VerificationContext): Promise<string> => {
  let proxyAddress: string
  if (isProxyChanged(contract, context)) {
    proxyAddress = getProposedProxyAddress(contract, context)
  } else {
    proxyAddress = await getRegisteredProxyAddress(contract, context)
  }
  await verifyProxy(proxyAddress, context)

  if (isImplementationChanged(contract, context)) {
    return getProposedImplementationAddress(contract, context)
  } else {
    return getProxiedAddress(proxyAddress, context)
  }
}

const getImplementationAddress = async (contract: string, isLibrary: boolean, context: VerificationContext): Promise<string> => {
  // Where we find the implementation address depends on two factors:
  // 1. Is the contract a core contract registered in the Registry vs. a linked
  // library.
  // 2. Is the contract affected by a governance proposal.
  // TODO: remove isBeforeRelease1. Before the first contracts upgrade,
  // libraries are not proxied.
  if (isLibrary && context.isBeforeRelease1) {
    return '0x' + context.libraryAddresses[contract]
  } else if (isLibrary) {
    return getLibraryAddress(contract, context)
  } else {
    return getCoreContractAddress(contract, context)
  }

}

const getOnchainBytecode = async (contract: string, isLibrary: boolean, context: VerificationContext): Promise<string> => {
  const implementationAddress = await getImplementationAddress(contract, isLibrary, context)
  const onchainBytecodeWithMetadata = await context.web3.eth.getCode(implementationAddress)
  return stripMetadata(onchainBytecodeWithMetadata)
}

const dfsStep = async (queue: string[], visited: Set<string>, context: VerificationContext) => {
  const contract = queue.pop()
  if (ignoredContracts.includes(contract)) {
    return
  }

  const isLibrary = !context.contracts.includes(contract)

  const sourceBytecode = getSoureBytecode(contract, context)
  const onchainBytecode = await getOnchainBytecode(contract, isLibrary, context)

  const sourceLibraryPositions = collectLibraryPositions(sourceBytecode)
  collectLibraryAddresses(onchainBytecode, sourceLibraryPositions, context.libraryAddresses)

  const linkedSourceBytecode = linkLibraries(sourceBytecode, context.libraryAddresses)

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
    const implementationAddress = await getImplementationAddress(contract, true, context)

    verifyLibraryPrefix(linkedSourceBytecode, '0000000000000000000000000000000000000000')
    verifyLibraryPrefix(onchainBytecode, implementationAddress.slice(2, 42).toLowerCase())

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

export const verifyBytecodesDfs = async (contracts: string[], artifacts: BuildArtifacts, registry: RegistryInstance, proposal: ProposalTx[], Proxy: Truffle.Contract<ProxyInstance>, web3: Web3, isBeforeRelease1: boolean = false) => {
  const queue = [...contracts]
  const visited: Set<string> = new Set()
  const libraryAddresses: LibraryAddresses = {}
  contracts.forEach(contract => visited.add(contract))

  const context: VerificationContext = {
    contracts,
    artifacts,
    libraryAddresses,
    registry,
    proposal,
    Proxy,
    web3,

    isBeforeRelease1
  }

  while (queue.length > 0) {
    await dfsStep(queue, visited, context)
  }
}
