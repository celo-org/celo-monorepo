/* eslint-disable no-console: 0 */
import { ensureLeading0x } from '@celo/base/lib/address'
import {
  LibraryAddresses,
  LibraryPositions,
  linkLibraries,
  stripMetadata,
  verifyAndStripLibraryPrefix,
} from '@celo/protocol/lib/bytecode'
import { verifyProxyStorageProof } from '@celo/protocol/lib/proxy-utils'
import { ProposalTx } from '@celo/protocol/scripts/truffle/make-release'
import { ZERO_ADDRESS } from '@celo/protocol/test/constants'
import { BuildArtifacts } from '@openzeppelin/upgrades'
import { ProxyInstance, RegistryInstance } from 'types'
import Web3 from 'web3'
import { ignoredContractsV9, ignoredContractsV9Only } from './ignored-contracts-v9'

let ignoredContracts = [
  // This contract is not proxied
  'TransferWhitelist',

  // These contracts are not in the Registry (before release 1)
  'ReserveSpenderMultiSig',
  'GovernanceApproverMultiSig'
]

interface VerificationContext {
  artifacts: BuildArtifacts[]
  libraryAddresses: LibraryAddresses
  registry: RegistryInstance
  governanceAddress: string
  proposal: ProposalTx[]
  Proxy: Truffle.Contract<ProxyInstance>
  web3: Web3
  network: string
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

export const isProxyRepointAndInitializeTransaction = (tx: ProposalTx) =>
  tx.contract.endsWith('Proxy') && tx.function === '_setAndInitializeImplementation'

export const isProxyRepointAndInitForIdTransaction = (tx: ProposalTx, registryId: string) =>
  tx.contract === registryId && isProxyRepointAndInitializeTransaction(tx)

const isProxyRepointForIdTransaction = (tx: ProposalTx, contract: string) =>
  tx.contract === `${contract}Proxy` && isProxyRepointTransaction(tx)

const isImplementationChanged = (contract: string, proposal: ProposalTx[]): boolean =>
  proposal.some((tx: ProposalTx) => isProxyRepointForIdTransaction(tx, contract))

const getProposedImplementationAddress = (contract: string, proposal: ProposalTx[]) =>
  proposal.find((tx: ProposalTx) => isProxyRepointForIdTransaction(tx, contract)).args[0]

// Checks if the given transaction is a repointing of the Registry entry for the
// given registryId.
const isRegistryRepointTransaction = (tx: ProposalTx) =>
  tx.contract === `Registry` && tx.function === 'setAddressFor'

const isRegistryRepointForIdTransaction = (tx: ProposalTx, registryId: string) =>
  isRegistryRepointTransaction(tx) && tx.args[0] === registryId

const isProxyChanged = (contract: string, proposal: ProposalTx[]): boolean =>
  proposal.some((tx) => isRegistryRepointForIdTransaction(tx, contract))

export const getProposedProxyAddress = (contract: string, proposal: ProposalTx[]): string => {
  const relevantTx = proposal.find((tx) => isRegistryRepointForIdTransaction(tx, contract))
  return relevantTx.args[1]
}

const getSourceBytecodeFromArtifacts = (contract: string, artifacts: BuildArtifacts[]): string =>
  stripMetadata(artifacts.map(a => a.getArtifactByName(contract)).find(a => a).deployedBytecode)

const getSourceBytecode = (contract: string, context: VerificationContext): string =>
  getSourceBytecodeFromArtifacts(contract, context.artifacts)

const getOnchainBytecode = async (address: string, context: VerificationContext) =>
  stripMetadata(await context.web3.eth.getCode(address))

const isLibrary = (contract: string, context: VerificationContext) =>
  contract in context.libraryAddresses.addresses

const dfsStep = async (queue: string[], visited: Set<string>, context: VerificationContext) => {
  const contract = queue.pop()
  // mark current DFS node as visited
  visited.add(contract)

  // check proxy deployment
  if (isProxyChanged(contract, context.proposal)) {
    const proxyAddress = getProposedProxyAddress(contract, context.proposal)
    // ganache does not support eth_getProof
    if (
      context.network !== 'development' &&
      !(await verifyProxyStorageProof(context.web3, proxyAddress, context.governanceAddress))
    ) {
      throw new Error(`Proposed ${contract}Proxy has impure storage`)
    }

    const onchainProxyBytecode = await getOnchainBytecode(proxyAddress, context)
    const sourceProxyBytecode = getSourceBytecode(`${contract}Proxy`, context)
    if (onchainProxyBytecode !== sourceProxyBytecode) {
      throw new Error(`Proposed ${contract}Proxy does not match compiled proxy bytecode`)
    }

  }

  // check implementation deployment
  const sourceBytecode = getSourceBytecode(contract, context)
  const sourceLibraryPositions = new LibraryPositions(sourceBytecode)

  let implementationAddress: string
  if (isImplementationChanged(contract, context.proposal)) {
    implementationAddress = getProposedImplementationAddress(contract, context.proposal)
  } else if (isLibrary(contract, context)) {
    implementationAddress = ensureLeading0x(context.libraryAddresses.addresses[contract])
  } else {
    const proxyAddress = await context.registry.getAddressForString(contract)
    if (proxyAddress === ZERO_ADDRESS) {
      console.log(`Contract ${contract} is not in registry - skipping bytecode verification`)
      return;
    }
    const proxy = await context.Proxy.at(proxyAddress) // necessary await
    implementationAddress = await proxy._getImplementation()
  }

  let onchainBytecode = await getOnchainBytecode(implementationAddress, context)
  context.libraryAddresses.collect(onchainBytecode, sourceLibraryPositions)

  let linkedSourceBytecode = linkLibraries(sourceBytecode, context.libraryAddresses.addresses)

  // normalize library bytecodes
  if (isLibrary(contract, context)) {
    linkedSourceBytecode = verifyAndStripLibraryPrefix(linkedSourceBytecode)
    onchainBytecode = verifyAndStripLibraryPrefix(onchainBytecode, implementationAddress)
  }

  if (onchainBytecode !== linkedSourceBytecode) {
    throw new Error(`${contract}'s onchain and compiled bytecodes do not match`)
  } else {
    console.log(
      `${isLibrary(contract, context) ? 'Library' : 'Contract'
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

  console.info('Proposal contains only valid release transactions!')
}

const assertValidInitializationData = (
  artifacts: BuildArtifacts[],
  proposal: ProposalTx[],
  web3: Web3,
  initializationData: InitializationData
) => {
  const initializingProposals = proposal.filter(isProxyRepointAndInitializeTransaction)
  const contractsInitialized = new Set()
  for (const proposalTx of initializingProposals) {
    const contractName = ContractNameExtractorRegex.exec(proposalTx.contract)[1]

    if (!initializationData[contractName]) {
      throw new Error(
        `Initialization Data for ${contractName} could not be found in reference file`
      )
    }

    const contract = artifacts.map(a => a.getArtifactByName(contractName)).find(a => a)
    const initializeAbi = contract.abi.find(
      (abi: any) => abi.type === 'function' && abi.name === 'initialize'
    )
    const args = initializationData[contractName]
    const callData = web3.eth.abi.encodeFunctionCall(initializeAbi, args)

    if (callData.toLowerCase() !== proposalTx.args[1].toLowerCase()) {
      throw new Error(
        `Intialization Data for ${contractName} in proposal does not match reference file ${initializationData[contractName]}`
      )
    }

    contractsInitialized.add(contractName)
  }

  for (const referenceContractName of Object.keys(initializationData)) {
    if (!contractsInitialized.has(referenceContractName)) {
      throw new Error(
        `Reference file has initialization data for ${referenceContractName}, but proposal does not specify initialization`
      )
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
  artifacts: BuildArtifacts[],
  registry: RegistryInstance,
  proposal: ProposalTx[],
  Proxy: Truffle.Contract<ProxyInstance>,
  _web3: Web3,
  initializationData: InitializationData = {},
  version?: number,
  network = 'development'
) => {
  assertValidProposalTransactions(proposal)
  assertValidInitializationData(artifacts, proposal, _web3, initializationData)

  const compiledContracts = Array.prototype.concat.apply([], artifacts.map(a => a.listArtifacts())).map((a) => a.contractName)

  if (version > 9) {
    ignoredContracts = [...ignoredContracts, ...ignoredContractsV9]
  } else if (version == 9) {
    ignoredContracts = [...ignoredContracts, ...ignoredContractsV9, ...ignoredContractsV9Only]
  }

  const queue = contracts.filter(
    (contract) => !ignoredContracts.includes(contract)
  ).filter(
    (contract) => compiledContracts.includes(contract)
  )

  const visited: Set<string> = new Set(queue)

  // truffle web3 version does not have getProof
  const web3 = new Web3(_web3.currentProvider)

  const governanceAddress = await registry.getAddressForString('Governance')
  const context: VerificationContext = {
    artifacts,
    libraryAddresses: new LibraryAddresses(),
    registry,
    governanceAddress,
    proposal,
    Proxy,
    web3,
    network,
  }

  while (queue.length > 0) {
    await dfsStep(queue, visited, context)
  }

  return context.libraryAddresses
}
