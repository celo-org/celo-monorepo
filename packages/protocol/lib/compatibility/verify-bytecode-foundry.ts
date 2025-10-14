/* eslint-disable no-console: 0 */
/**
 * Foundry-based bytecode verification for deployed smart contracts.
 * 
 * This module verifies that deployed bytecode matches compiled Foundry artifacts.
 * Key differences from Truffle version:
 * - Uses Foundry artifacts with deployedBytecode.object structure
 * - Handles Foundry's hashed library placeholders: __$<hash>$__
 * - Computes library hashes based on source paths
 */

import { ensureLeading0x } from '@celo/base/lib/address'
import {
  computeFoundryLibraryHash,
  LibraryAddressesFoundry,
  LibraryLinksFoundry,
  LibraryPositionsFoundry,
  LibrarySourcePaths,
  linkLibrariesFoundry,
  stripMetadata,
  verifyAndStripLibraryPrefix,
} from '@celo/protocol/lib/bytecode-foundry'
import { FoundryBuildArtifacts } from '@celo/protocol/lib/foundry-artifacts'
import { verifyProxyStorageProof } from '@celo/protocol/lib/proxy-utils'
import { ProposalTx } from '@celo/protocol/scripts/truffle/make-release'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { ignoredContractsV9, ignoredContractsV9Only } from './ignored-contracts-v9'

let ignoredContracts = [
  // This contract is not proxied
  'TransferWhitelist',

  // These contracts are not in the Registry (before release 1)
  'ReserveSpenderMultiSig',
  'GovernanceApproverMultiSig',

  // These contracts live in monorepo but are not part of the core protocol
  'CeloFeeCurrencyAdapterOwnable',
  'FeeCurrencyAdapter',
  'FeeCurrencyAdapterOwnable',
]

interface VerificationContext {
  artifacts: FoundryBuildArtifacts[]
  libraryAddresses: LibraryAddressesFoundry
  registry: Contract
  governanceAddress: string
  proposal: ProposalTx[]
  proxyABI: any[]
  web3: Web3
  network: string
  debug: boolean
}

interface InitializationData {
  [contractName: string]: any[]
}

const ContractNameExtractorRegex = new RegExp(/(.*)Proxy/)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Checks if the given transaction is a repointing of the Proxy for the given contract
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

// Checks if the given transaction is a repointing of the Registry entry for the given registryId
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

/**
 * Get deployed bytecode from Foundry artifacts
 */
const getSourceBytecodeFromArtifacts = (
  contract: string,
  artifacts: FoundryBuildArtifacts[]
): string => {
  for (const artifactSet of artifacts) {
    const artifact = artifactSet.getArtifactByName(contract)
    if (artifact) {
      return stripMetadata(artifact.deployedBytecode)
    }
  }
  throw new Error(`Contract ${contract} not found in any artifact set`)
}

const getSourceBytecode = (contract: string, context: VerificationContext): string =>
  getSourceBytecodeFromArtifacts(contract, context.artifacts)

const getOnchainBytecode = async (address: string, context: VerificationContext) =>
  stripMetadata(await context.web3.eth.getCode(address))

const isLibrary = (contract: string, context: VerificationContext) =>
  contract in context.libraryAddresses.addresses

/**
 * Get library link references from the contract's artifact.
 * Returns a Map of library name -> { sourcePath, positions }.
 */
const getLibraryLinkReferences = (
  contract: string,
  artifacts: FoundryBuildArtifacts[],
  debug: boolean
): Map<string, { sourcePath: string; positions: Array<{ start: number; length: number }> }> => {
  const linkRefs = new Map<string, { sourcePath: string; positions: Array<{ start: number; length: number }> }>()

  if (debug) console.log(`\n>>> [getLibraryLinkReferences] Looking for ${contract}`)

  for (const artifactSet of artifacts) {
    if (debug) console.log(`>>>   [getLibraryLinkReferences] Checking artifact set from: ${artifactSet.directory}`)
    const rawArtifact = artifactSet.getRawArtifact(contract)
    if (!rawArtifact) {
      if (debug) console.log(`>>>   [getLibraryLinkReferences] No artifact in this set`)
      continue
    }

    if (debug) {
      console.log(`>>>   [getLibraryLinkReferences] ✓ Found artifact in ${artifactSet.directory}`)
      console.log(`>>>   [getLibraryLinkReferences] Has deployedBytecode: ${!!rawArtifact.deployedBytecode}`)
      console.log(`>>>   [getLibraryLinkReferences] Has deployedBytecode.linkReferences: ${!!rawArtifact.deployedBytecode?.linkReferences}`)
    }

    if (debug && rawArtifact.deployedBytecode?.linkReferences) {
      const deployedKeys = Object.keys(rawArtifact.deployedBytecode.linkReferences)
      console.log(`>>>   [getLibraryLinkReferences] deployedBytecode.linkReferences sources: ${JSON.stringify(deployedKeys)}`)
    }

    if (debug) {
      console.log(`>>>   [getLibraryLinkReferences] Has bytecode.linkReferences: ${!!rawArtifact.bytecode?.linkReferences}`)
    }

    if (debug && rawArtifact.bytecode?.linkReferences) {
      const bytecodeKeys = Object.keys(rawArtifact.bytecode.linkReferences)
      console.log(`>>>   [getLibraryLinkReferences] bytecode.linkReferences sources: ${JSON.stringify(bytecodeKeys)}`)
    }

    // Check deployedBytecode.linkReferences first (this is what we need for verification)
    if (rawArtifact.deployedBytecode?.linkReferences) {
      if (debug) console.log(`>>>   [getLibraryLinkReferences] ✓ Using deployedBytecode.linkReferences rawraw ${JSON.stringify(rawArtifact.deployedBytecode.linkReferences)}`)
      // linkReferences format: { "sourcePath": { "LibraryName": [...positions] } }
      for (const sourcePath of Object.keys(rawArtifact.deployedBytecode.linkReferences)) {
        for (const libraryName of Object.keys(rawArtifact.deployedBytecode.linkReferences[sourcePath])) {
          const positions = rawArtifact.deployedBytecode.linkReferences[sourcePath][libraryName]
          if (debug) console.log(`>>>     [getLibraryLinkReferences] ${libraryName} @ ${sourcePath}: ${JSON.stringify(positions)}`)
          linkRefs.set(libraryName, { sourcePath, positions })
        }
      }
    }

    // Also check bytecode.linkReferences if nothing found
    if (linkRefs.size === 0 && rawArtifact.bytecode?.linkReferences) {
      if (debug) console.log(`>>>   [getLibraryLinkReferences] ⚠️ FALLBACK to bytecode.linkReferences (deployedBytecode had no refs)`)
      for (const sourcePath of Object.keys(rawArtifact.bytecode.linkReferences)) {
        for (const libraryName of Object.keys(rawArtifact.bytecode.linkReferences[sourcePath])) {
          const positions = rawArtifact.bytecode.linkReferences[sourcePath][libraryName]
          if (debug) console.log(`>>>     [getLibraryLinkReferences] ${libraryName} @ ${sourcePath}: ${JSON.stringify(positions)}`)
          linkRefs.set(libraryName, { sourcePath, positions })
        }
      }
    }

    // If we found some, we're done
    if (linkRefs.size > 0) {
      if (debug) console.log(`>>>   [getLibraryLinkReferences] Found ${linkRefs.size} references, breaking`)
      break
    }
  }

  if (debug) console.log(`>>> [getLibraryLinkReferences] Returning ${linkRefs.size} references\n`)
  return linkRefs
}

const dfsStep = async (queue: string[], visited: Set<string>, context: VerificationContext) => {
  const contract = queue.pop()
  if (!contract) return

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
  const sourceLibraryPositions = new LibraryPositionsFoundry()

  if (context.debug) console.log(`\n>>> Verifying contract: ${contract}`)

  // Find library dependencies from linkReferences and register them in LibraryPositions
  // This gives us library name, source path, AND exact positions from the artifact
  const libraryLinkRefs = getLibraryLinkReferences(contract, context.artifacts, context.debug)

  if (context.debug) {
    console.log(`>>> Found ${libraryLinkRefs.size} library dependencies from linkReferences:`)

    libraryLinkRefs.forEach((linkRefData, libName) => {
      const { sourcePath, positions } = linkRefData
      const hash = computeFoundryLibraryHash(sourcePath, libName)
      console.log(`>>>   ${libName}: ${sourcePath}`)
      console.log(`>>>     Hash: ${hash}`)
      console.log(`>>>     Positions: ${positions.map(p => p.start).join(', ')}`)
    })
  }

  libraryLinkRefs.forEach((linkRefData, libName) => {
    const { sourcePath, positions } = linkRefData
    sourceLibraryPositions.registerLibraryFromLinkReferences(libName, sourcePath, positions)
  })

  if (context.debug) {
    console.log(`>>> LibraryPositions after registration:`)
    console.log(`>>>   Total hashes in positions: ${Object.keys(sourceLibraryPositions.positions).length}`)
    console.log(`>>>   Total libraries registered: ${Object.keys(sourceLibraryPositions.hashToLibrary).length}`)
    Object.keys(sourceLibraryPositions.hashToLibrary).forEach(hash => {
      const lib = sourceLibraryPositions.hashToLibrary[hash]
      const positions = sourceLibraryPositions.positions[hash] || []
      console.log(`>>>     ${hash} -> ${lib.name} (${lib.sourcePath}) at positions: ${positions.join(', ')}`)
    })
  }

  let implementationAddress: string
  if (isImplementationChanged(contract, context.proposal)) {
    implementationAddress = getProposedImplementationAddress(contract, context.proposal)
  } else if (isLibrary(contract, context)) {
    implementationAddress = ensureLeading0x(context.libraryAddresses.addresses[contract])
  } else {
    const proxyAddress = await context.registry.methods.getAddressForString(contract).call()
    if (proxyAddress === ZERO_ADDRESS) {
      if (context.debug) console.log(`Contract ${contract} is not in registry - skipping bytecode verification`)
      return
    }
    const proxy = new context.web3.eth.Contract(context.proxyABI, proxyAddress)
    implementationAddress = await proxy.methods._getImplementation().call()
  }

  let onchainBytecode = await getOnchainBytecode(implementationAddress, context)
  if (context.debug) {
    console.log("contract name", contract);
    console.log("implementationAddress", implementationAddress);
    console.log("onchainBytecode", onchainBytecode);
  }
  context.libraryAddresses.collect(onchainBytecode, sourceLibraryPositions, context.debug)

  if (context.debug) console.log("sourceLibraryPositions", sourceLibraryPositions);

  // Build library links and source paths for linking
  const libraryLinks: LibraryLinksFoundry = {}
  const librarySourcePaths: LibrarySourcePaths = {}

  Object.keys(context.libraryAddresses.addresses).forEach((libName) => {
    libraryLinks[libName] = context.libraryAddresses.addresses[libName]
    librarySourcePaths[libName] = context.libraryAddresses.sourcePaths[libName]
  })

  let linkedSourceBytecode = linkLibrariesFoundry(sourceBytecode, libraryLinks, librarySourcePaths)

  // normalize library bytecodes
  if (isLibrary(contract, context)) {
    linkedSourceBytecode = verifyAndStripLibraryPrefix(linkedSourceBytecode)
    onchainBytecode = verifyAndStripLibraryPrefix(onchainBytecode, implementationAddress)
  }

  if (onchainBytecode !== linkedSourceBytecode) {
    throw new Error(`${contract}'s onchain and compiled bytecodes do not match`)
  } else {
    console.info(
      `✅ ${isLibrary(contract, context) ? 'Library' : 'Contract'} ${contract} matches (deployed at ${implementationAddress})`
    )
  }

  // push unvisited libraries to DFS queue
  const libraryNames = sourceLibraryPositions.getLibraryNames()
  queue.push(...libraryNames.filter((library) => !visited.has(library)))
}

const assertValidProposalTransactions = (proposal: ProposalTx[], debug: boolean) => {
  const invalidTransactions = proposal.filter(
    (tx) => !isProxyRepointTransaction(tx) && !isRegistryRepointTransaction(tx)
  )
  if (invalidTransactions.length > 0) {
    throw new Error(`Proposal contains invalid release transactions ${invalidTransactions}`)
  }

  if (debug) console.info('Proposal contains only valid release transactions!')
}

const assertValidInitializationData = (
  artifacts: FoundryBuildArtifacts[],
  proposal: ProposalTx[],
  web3: Web3,
  initializationData: InitializationData,
  debug: boolean
) => {
  const initializingProposals = proposal.filter(isProxyRepointAndInitializeTransaction)
  const contractsInitialized = new Set()

  for (const proposalTx of initializingProposals) {
    const contractName = ContractNameExtractorRegex.exec(proposalTx.contract)?.[1]
    if (!contractName) {
      throw new Error(`Could not extract contract name from ${proposalTx.contract}`)
    }

    if (!initializationData[contractName]) {
      throw new Error(
        `Initialization Data for ${contractName} could not be found in reference file`
      )
    }

    // Find the contract artifact
    let contract: any = null
    for (const artifactSet of artifacts) {
      const artifact = artifactSet.getArtifactByName(contractName)
      if (artifact) {
        contract = artifact
        break
      }
    }

    if (!contract) {
      throw new Error(`Artifact for ${contractName} not found`)
    }

    const initializeAbi = contract.abi.find(
      (abi: any) => abi.type === 'function' && abi.name === 'initialize'
    )

    if (!initializeAbi) {
      throw new Error(`Initialize function not found in ABI for ${contractName}`)
    }

    const args = initializationData[contractName]
    const callData = web3.eth.abi.encodeFunctionCall(initializeAbi, args)

    if (callData.toLowerCase() !== proposalTx.args[1].toLowerCase()) {
      throw new Error(
        `Initialization Data for ${contractName} in proposal does not match reference file`
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

  if (debug) console.info('Initialization Data was verified!')
}

/**
 * Main verification function for Foundry-compiled contracts.
 * This function will visit all contracts in `contracts` as well as any
 * linked libraries and verify that the compiled and linked source code matches
 * the deployed bytecode registered or proposed.
 *
 * @param contracts - List of contract names to verify
 * @param artifacts - Foundry build artifacts
 * @param registry - Web3 Contract instance for Registry
 * @param proposal - Governance proposal transactions
 * @param proxyABI - ABI for Proxy contract
 * @param _web3 - Web3 instance
 * @param initializationData - Initialization data for contracts
 * @param version - Release version number
 * @param network - Network name
 */
export const verifyBytecodesFoundry = async (
  contracts: string[],
  artifacts: FoundryBuildArtifacts[],
  registry: Contract,
  proposal: ProposalTx[],
  proxyABI: any[],
  _web3: Web3,
  initializationData: InitializationData = {},
  version?: number,
  network = 'development',
  debug = false
) => {
  assertValidProposalTransactions(proposal, debug)
  assertValidInitializationData(artifacts, proposal, _web3, initializationData, debug)

  const compiledContracts = Array.prototype.concat
    .apply(
      [],
      artifacts.map((a) => a.listArtifacts())
    )
    .map((a: any) => a.contractName)

  if (version && version > 9) {
    ignoredContracts = [...ignoredContracts, ...ignoredContractsV9]
  } else if (version === 9) {
    ignoredContracts = [...ignoredContracts, ...ignoredContractsV9, ...ignoredContractsV9Only]
  }

  const queue = contracts
    .filter((contract) => !ignoredContracts.includes(contract))
    .filter((contract) => compiledContracts.includes(contract))

  const visited: Set<string> = new Set(queue)

  // Use provided web3 instance
  const web3 = _web3

  const governanceAddress = await registry.methods.getAddressForString('Governance').call()
  const context: VerificationContext = {
    artifacts,
    libraryAddresses: new LibraryAddressesFoundry(),
    registry,
    governanceAddress,
    proposal,
    proxyABI,
    web3,
    network,
    debug,
  }

  while (queue.length > 0) {
    await dfsStep(queue, visited, context)
  }

  return context.libraryAddresses
}

