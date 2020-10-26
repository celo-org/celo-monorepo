import {
  LibraryAddresses,
  LibraryPositions,
  linkLibraries,
  stripMetadata,
  verifyLibraryPrefix,
} from '@celo/protocol/lib/bytecode'
import { ProposalTx } from '@celo/protocol/scripts/truffle/make-release'
import { BuildArtifacts } from '@openzeppelin/upgrades'
import { ProxyInstance, RegistryInstance } from 'types'
import Web3 from 'web3'

const ignoredContracts = [
  // This contract is not proxied
  'TransferWhitelist',

  // These contracts are not in the Registry (before release 1)
  'ReserveSpenderMultiSig',
  'GovernanceApproverMultiSig',
]

interface VerificationContext {
  artifacts: BuildArtifacts
  libraryAddresses: LibraryAddresses
  registry: RegistryInstance
  proposal: ProposalTx[]
  Proxy: Truffle.Contract<ProxyInstance>
  web3: Web3

  // TODO: remove this after first smart contracts release
  isBeforeRelease1: boolean
}

// Checks if the given transaction is a repointing of the Proxy for the given
// contract.
const isProxyRepointTransaction = (tx: ProposalTx) =>
  tx.contract.endsWith('Proxy') &&
  (tx.function === '_setImplementation' || tx.function === '_setAndInitializeImplementation')

const isProxyRepointForIdTransaction = (tx: ProposalTx, contract: string) =>
  tx.contract === `${contract}Proxy` && isProxyRepointTransaction(tx)

const isImplementationChanged = (contract: string, context: VerificationContext): boolean =>
  context.proposal.some((tx: ProposalTx) => isProxyRepointForIdTransaction(tx, contract))

const getProposedImplementationAddress = (contract: string, context: VerificationContext) =>
  context.proposal.find((tx: ProposalTx) => isProxyRepointForIdTransaction(tx, contract)).args[0]

// Checks if the given transaction is a repointing of the Registry entry for the
// given registryId.
const isRegistryRepointTransaction = (tx: ProposalTx) =>
  tx.contract === `Registry` && tx.function === 'setAddressFor'

const isRegistryRepointForIdTransaction = (tx: ProposalTx, registryId: string) =>
  isRegistryRepointTransaction(tx) && tx.args[0] === registryId

const isProxyChanged = (contract: string, context: VerificationContext): boolean => {
  return context.proposal.some((tx) => isRegistryRepointForIdTransaction(tx, contract))
}

const getProposedProxyAddress = (contract: string, context: VerificationContext): string => {
  const relevantTx = context.proposal.find((tx) => isRegistryRepointForIdTransaction(tx, contract))
  return relevantTx.args[1]
}

const getSourceBytecode = (contract: string, context: VerificationContext): string =>
  stripMetadata(context.artifacts.getArtifactByName(contract).deployedBytecode)

const getOnchainBytecode = async (address: string, context: VerificationContext) =>
  stripMetadata(await context.web3.eth.getCode(address))

const isLibrary = (contract: string, context: VerificationContext) =>
  contract in context.libraryAddresses.addresses

const getImplementationAddress = async (contract: string, context: VerificationContext) => {
  // Where we find the implementation address depends on two factors:
  // 1. Is the contract affected by a governance proposal?
  // 2. Is the contract registered in the Registry or a linked library?

  if (isImplementationChanged(contract, context)) {
    return getProposedImplementationAddress(contract, context)
  }

  if (isLibrary(contract, context)) {
    return `0x${context.libraryAddresses.addresses[contract]}`
  }

  // contract is registered but we need to check if the proxy is affected by the proposal
  const proxyAddress = isProxyChanged(contract, context)
    ? getProposedProxyAddress(contract, context)
    : await context.registry.getAddressForString(contract)

  // at() returns a promise despite Typescript labelling the await as extraneous
  const proxy: ProxyInstance = await context.Proxy.at(
    context.web3.utils.toChecksumAddress(proxyAddress)
  )
  return proxy._getImplementation()
}

const dfsStep = async (queue: string[], visited: Set<string>, context: VerificationContext) => {
  const contract = queue.pop()
  // mark current DFS node as visited
  visited.add(contract)

  // get source code
  const sourceBytecode = getSourceBytecode(contract, context)
  const sourceLibraryPositions = new LibraryPositions(sourceBytecode)

  // get deployed code
  const implementationAddress = await getImplementationAddress(contract, context)
  let onchainBytecode = await getOnchainBytecode(implementationAddress, context)
  context.libraryAddresses.collect(onchainBytecode, sourceLibraryPositions)

  let linkedSourceBytecode = linkLibraries(sourceBytecode, context.libraryAddresses.addresses)

  // normalize library bytecodes
  if (isLibrary(contract, context)) {
    linkedSourceBytecode = verifyLibraryPrefix(
      linkedSourceBytecode,
      '0000000000000000000000000000000000000000'
    )
    onchainBytecode = verifyLibraryPrefix(onchainBytecode, implementationAddress)
  }

  if (onchainBytecode !== linkedSourceBytecode) {
    throw new Error(`${contract}'s onchain and compiled bytecodes do not match`)
  } else {
    // tslint:disable-next-line: no-console
    console.log(
      `${
        isLibrary(contract, context) ? 'Library' : 'Contract'
      } deployed at ${implementationAddress} matches ${contract}`
    )
  }

  // push unvisited libraries to DFS queue
  queue.push(
    ...Object.keys(sourceLibraryPositions.positions).filter((library) => !visited.has(library))
  )
}

/*
 * This function will visit all contracts in `contracts` as well as any
 * linked libraries and verify that the compiled and linked source code matches
 * the deployed bytecode registered or proposed.
 */
export const verifyBytecodes = async (
  contracts: string[],
  artifacts: BuildArtifacts,
  registry: RegistryInstance,
  proposal: ProposalTx[],
  Proxy: Truffle.Contract<ProxyInstance>,
  web3: Web3,
  isBeforeRelease1: boolean = false
) => {
  const invalidTransactions = proposal.filter(
    (tx) => !isProxyRepointTransaction(tx) && !isRegistryRepointTransaction(tx)
  )
  if (invalidTransactions.length > 0) {
    throw new Error(`Proposal contains invalid release transactions ${invalidTransactions}`)
  }

  const queue = contracts.filter((contract) => !ignoredContracts.includes(contract))
  const visited: Set<string> = new Set(queue)

  const context: VerificationContext = {
    artifacts,
    libraryAddresses: new LibraryAddresses(),
    registry,
    proposal,
    Proxy,
    web3,
    isBeforeRelease1,
  }

  while (queue.length > 0) {
    await dfsStep(queue, visited, context)
  }
}
