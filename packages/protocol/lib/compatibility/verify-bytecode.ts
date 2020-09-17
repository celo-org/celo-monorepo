// tslint:disable: max-classes-per-file
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

  collect(bytecode: string, libraryPositions: LibraryPositions) {
    Object.keys(libraryPositions.positions).forEach(library => {
      libraryPositions.positions[library].forEach(position => {
        if (!this.addAddress(library, bytecode.slice(position, position + 40))) {
          throw new Error(`Mismatched addresses for ${library} at ${position}`)
        }
      })
    })
  }

  /*
   * Tries to add a library name -> address mapping. If the library has already
   * had an address added, checks that the new address matches the old one.
   */
  private addAddress(library: string, address: string): boolean {
    if (!this.addresses[library]) {
      this.addresses[library] = address
    } else if (this.addresses[library] !== address) {
      return false
    }
    return true
  }
}

// TODO: check against known Proxy bytecodes
const isProxyBytecode = (_bytecode: string) => {
  return true
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
const verifyLibraryPrefix = (bytecode: string, address: string) => {
  if (bytecode.slice(2, 4) !== PUSH20_OPCODE) {
    throw new Error(`Library bytecode doesn't start with address load`)
  } else if (bytecode.slice(4, 44) !== address) {
    throw new Error(`Library bytecode loads unexpected address at start`)
  }
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
  const relevantTx = context.proposal.find((tx: ProposalTx) => {
    return tx.contract === `Registry` && tx.function === 'setAddressFor' && tx.args[0] === registryId
  })

  return relevantTx.args[1]
}

const getProposedImplementationAddress = (contract: string, context: VerificationContext): string => {
  const relevantTx = context.proposal.find((tx: ProposalTx) => {
    return tx.contract === `${contract}Proxy`
  })

  return relevantTx.args[0]
}

const getSourceBytecode = (contract: string, context: VerificationContext): string => {
  const sourceBytecodeWithMetadata = context.artifacts.getArtifactByName(contract).deployedBytecode
  return stripMetadata(sourceBytecodeWithMetadata)
}

const getLibraryAddress = async (contract: string, context: VerificationContext): Promise<string> => {
  const proxyAddress = context.libraryAddresses.addresses[contract]
  await verifyProxy(proxyAddress, context)

  if (isImplementationChanged(contract, context)) {
    return getProposedImplementationAddress(contract, context)
  } else {
    return getProxiedAddress(proxyAddress, context)
  }
}

const getCoreContractAddress = async (contract: string, context: VerificationContext): Promise<string> => {
  const proxyAddress: string = isProxyChanged(contract, context) ?
    getProposedProxyAddress(contract, context) :
    await getRegisteredProxyAddress(contract, context)

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
    return '0x' + context.libraryAddresses.addresses[contract]
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

  const isLibrary = !context.contracts.includes(contract)

  const sourceBytecode = getSourceBytecode(contract, context)
  const onchainBytecode = await getOnchainBytecode(contract, isLibrary, context)

  const sourceLibraryPositions = new LibraryPositions(sourceBytecode)
  context.libraryAddresses.collect(onchainBytecode, sourceLibraryPositions)

  const linkedSourceBytecode = linkLibraries(sourceBytecode, context.libraryAddresses.addresses)

  // See comment above `verifyLibraryPrefix` for why we need to normalize bytecodes.
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

  Object.keys(sourceLibraryPositions.positions).forEach(library => {
    if (!visited.has(library)) {
      queue.push(library)
      visited.add(library)
    }
  })
}

/*
 * This function will visit all contracts in `contracts` as well as any
 * libraries that they link. In each step of this DFS, we:
 *
 * - 
 */
export const verifyBytecodesDfs = async (contracts: string[], artifacts: BuildArtifacts, registry: RegistryInstance, proposal: ProposalTx[], Proxy: Truffle.Contract<ProxyInstance>, web3: Web3, isBeforeRelease1: boolean = false) => {
  const queue = [...contracts.filter(contract => !ignoredContracts.includes(contract))]
  const visited: Set<string> = new Set()
  const libraryAddresses: LibraryAddresses = new LibraryAddresses()
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
