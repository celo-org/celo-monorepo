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
}
interface InitializationData {
  [contractName: string]: any[]
}

const ContractNameExtractorRegex = new RegExp(/(.*)Proxy/)


// Checks if the given transaction is a repointing of the Proxy for the given
// contract.
const isProxyRepointTransaction = (tx: ProposalTx) =>
  tx.contract.endsWith('Proxy') &&
  (tx.function === '_setImplementation' || tx.function === '_setAndInitializeImplementation')

const isProxyRepointAndInitializeTransaction = (tx: ProposalTx) =>
  tx.contract.endsWith('Proxy') &&
    tx.function === '_setAndInitializeImplementation'
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

const assertValidProposalTransactions = (proposal: ProposalTx[]) => {
  const invalidTransactions = proposal.filter(
    (tx) => !isProxyRepointTransaction(tx) && !isRegistryRepointTransaction(tx)
  )
  if (invalidTransactions.length > 0) {
    throw new Error(`Proposal contains invalid release transactions ${invalidTransactions}`)
  }

  console.info("Proposal contains only valid release transactions!")
}

const assertValidInitializationData = (
  artifacts: BuildArtifacts,
  proposal: ProposalTx[],
  web3: Web3,
  initializationData: InitializationData
) => {
  const initializingProposals = proposal.filter(isProxyRepointAndInitializeTransaction)
  const contractsInitialized = new Set()
  for (const proposalTx of initializingProposals) {
    const contractName = ContractNameExtractorRegex.exec(proposalTx.contract)[1]

    if (!initializationData[contractName]) {
      throw new Error(`Initialization Data for ${contractName} could not be found in reference file`)
    }

    const contract = artifacts.getArtifactByName(contractName)
    const initializeAbi = contract.abi.find(
      (abi: any) => abi.type === 'function' && abi.name === 'initialize')
    const args = initializationData[contractName]
    const callData = web3.eth.abi.encodeFunctionCall(initializeAbi, args)

    if (callData !== proposalTx.args[1]) {
      throw new Error(`Intialization Data for ${contractName} in proposal does not match reference file ${initializationData[contractName]}`)
    }

    contractsInitialized.add(contractName)
  }

  for (const referenceContractName of Object.keys(initializationData)) {
    if (!contractsInitialized.has(referenceContractName)) {
      throw new Error(`Reference file has initialization data for ${referenceContractName}, but proposal does not specify initialization`)
    }
  }

  console.info('Initialization Data was verified!')
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
  initializationData: InitializationData = {}
) => {
  assertValidProposalTransactions(proposal)
  assertValidInitializationData(artifacts, proposal, web3, initializationData)

  const queue = contracts.filter((contract) => !ignoredContracts.includes(contract))
  const visited: Set<string> = new Set(queue)

  const context: VerificationContext = {
    artifacts,
    libraryAddresses: new LibraryAddresses(),
    registry,
    proposal,
    Proxy,
    web3,
  }

  while (queue.length > 0) {
    await dfsStep(queue, visited, context)
  }
}
