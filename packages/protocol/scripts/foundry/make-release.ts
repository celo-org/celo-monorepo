/* eslint-disable no-console */
import { LibraryAddresses } from '@celo/protocol/lib/bytecode'
import { ASTDetailedVersionedReport } from '@celo/protocol/lib/compatibility/report'
import { getCeloContractDependencies } from '@celo/protocol/lib/contract-dependencies'
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { ForgeArtifact } from '@celo/protocol/scripts/foundry/ForgeArtifact'
import { NULL_ADDRESS, eqAddress } from '@celo/utils/lib/address'
import { exec } from 'child_process'
import { existsSync, readJsonSync, readdirSync, writeJsonSync } from 'fs-extra'
import { basename, join } from 'path'
import { TextEncoder, promisify } from 'util'

const execAsync = promisify(exec)
import {
  Abi,
  Account,
  Chain,
  Hex,
  Address as ViemAddress,
  PublicClient,
  Transport,
  WalletClient,
  createPublicClient,
  createWalletClient,
  defineChain,
  decodeFunctionResult,
  encodeFunctionData,
  http,
  keccak256,
  toHex,
} from 'viem'

// Use Pick to extract only the methods we need from viem's client types
// This maintains compatibility with viem's complex generics
type PublicClientMethods = Pick<
  PublicClient<Transport, Chain>,
  'call' | 'waitForTransactionReceipt'
>

type WalletClientMethods = Pick<
  WalletClient<Transport, Chain, Account>,
  'account' | 'chain' | 'deployContract' | 'writeContract'
>

// Registry ABI for getAddressForString - used for type-safe contract reads
const registryGetAddressAbi = [
  {
    type: 'function',
    name: 'getAddressForString',
    inputs: [{ name: 'identifier', type: 'string' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts'
import * as viemChains from 'viem/chains'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { getReleaseVersion, ignoredContractsV9 } from '../../lib/compatibility/ignored-contracts-v9'
// AbiParameter type is inferred from Abi entries
type AbiParameter = {
  name?: string
  type: string
  internalType?: string
  components?: AbiParameter[]
}

interface MakeReleaseArgv {
  report: string
  proposal: string
  librariesFile: string
  initializeData: string
  buildDirectory: string
  branch: string
  network: string
  privateKey?: string
  mnemonic?: string
  rpcUrl?: string
  skipVerification?: boolean
  celoscanApiKey?: string
}

// Track linked library for verification
interface LinkedLibrary {
  sourceFile: string
  name: string
  address: string
}

// Track deployed contracts for verification
interface DeployedContract {
  name: string
  address: string
  sourceFile: string
  constructorArgs: any[]
  isLibrary: boolean
  compilerVersion: string
  optimizerEnabled: boolean
  optimizerRuns: number
  evmVersion: string
  linkedLibraries: LinkedLibrary[]
  foundryProfile?: string // Foundry compilation profile for verification
}

// Network verification configuration
interface VerificationConfig {
  celoscanApiUrl: string
  celoscanApiKey?: string
  blockscoutApiUrl: string
  chainId: number
}

const getVerificationConfig = (networkName: string): VerificationConfig | null => {
  // Etherscan V2 API uses unified endpoint: https://api.etherscan.io/v2/api?chainid=CHAINID
  // Works with a single API key for all supported chains
  switch (networkName.toLowerCase()) {
    case 'celo':
    case 'mainnet':
    case 'rc1':
      return {
        celoscanApiUrl: 'https://api.etherscan.io/v2/api?chainid=42220',
        blockscoutApiUrl: 'https://celo.blockscout.com/api/',
        chainId: 42220,
      }
    case 'celo-sepolia':
      return {
        celoscanApiUrl: 'https://api.etherscan.io/v2/api?chainid=11142220',
        blockscoutApiUrl: 'https://celo-sepolia.blockscout.com/api/',
        chainId: 11142220,
      }
    default:
      // Local forks don't need verification
      return null
  }
}

// Store deployed contracts for verification
const deployedContracts: DeployedContract[] = []

const verifyContractOnBlockscout = async (
  contract: DeployedContract,
  config: VerificationConfig,
  rpcUrl: string
): Promise<boolean> => {
  // Build forge verify-contract command for Blockscout
  const cmd = [
    'forge verify-contract',
    `--rpc-url "${rpcUrl}"`,
    contract.address,
    `"${contract.sourceFile}:${contract.name}"`,
    '--verifier blockscout',
    `--verifier-url "${config.blockscoutApiUrl}"`,
    `--compiler-version ${contract.compilerVersion}`,
    `--evm-version ${contract.evmVersion}`,
    '--watch',
    '--retries 5',
  ]

  // Add optimizer settings
  if (contract.optimizerEnabled) {
    cmd.push(`--num-of-optimizations ${contract.optimizerRuns}`)
  }

  // Add constructor args if present
  if (contract.constructorArgs && contract.constructorArgs.length > 0) {
    const encodedArgs = encodeConstructorArgs(contract.constructorArgs)
    if (encodedArgs) {
      cmd.push(`--constructor-args ${encodedArgs}`)
    }
  }

  // Add linked libraries if present (critical for contracts that use libraries)
  if (contract.linkedLibraries && contract.linkedLibraries.length > 0) {
    for (const lib of contract.linkedLibraries) {
      cmd.push(`--libraries "${lib.sourceFile}:${lib.name}:${lib.address}"`)
    }
  }

  const fullCmd = cmd.join(' ')

  // Set FOUNDRY_PROFILE environment variable for proper compilation settings
  const env = { ...process.env }
  if (contract.foundryProfile) {
    env.FOUNDRY_PROFILE = contract.foundryProfile
  }

  // Retry loop for handling "Address is not a smart-contract" errors
  for (let attempt = 0; attempt <= VERIFICATION_MAX_RETRIES; attempt++) {
    try {
      await execAsync(fullCmd, {
        cwd: process.cwd(),
        timeout: 180000, // 3 minute timeout
        env,
      })

      process.stdout.write(' Blockscout ✓')
      return true
    } catch (error: any) {
      const isRetryable = isRetryableVerificationError(error)
      const hasRetriesLeft = attempt < VERIFICATION_MAX_RETRIES

      if (isRetryable && hasRetriesLeft) {
        const delay = getRetryDelay(attempt)
        process.stdout.write(` (retry ${attempt + 1}...)`)
        await sleep(delay)
        continue
      }

      process.stdout.write(' Blockscout ✗')
      return false
    }
  }

  return false
}

const verifyContractOnCeloscan = async (
  contract: DeployedContract,
  config: VerificationConfig,
  rpcUrl: string
): Promise<boolean> => {
  if (!config.celoscanApiKey) {
    process.stdout.write(' Celoscan (skipped)')
    return false
  }

  // Build forge verify-contract command for Celoscan (Etherscan-compatible)
  const cmd = [
    'forge verify-contract',
    `--rpc-url "${rpcUrl}"`,
    contract.address,
    `"${contract.sourceFile}:${contract.name}"`,
    '--verifier etherscan',
    `--verifier-url "${config.celoscanApiUrl}"`,
    `--etherscan-api-key "${config.celoscanApiKey}"`,
    `--chain-id ${config.chainId}`,
    `--compiler-version ${contract.compilerVersion}`,
    `--evm-version ${contract.evmVersion}`,
    '--watch',
    '--retries 5',
  ]

  // Add optimizer settings
  if (contract.optimizerEnabled) {
    cmd.push(`--num-of-optimizations ${contract.optimizerRuns}`)
  }

  // Add constructor args if present
  if (contract.constructorArgs && contract.constructorArgs.length > 0) {
    const encodedArgs = encodeConstructorArgs(contract.constructorArgs)
    if (encodedArgs) {
      cmd.push(`--constructor-args ${encodedArgs}`)
    }
  }

  // Add linked libraries if present (critical for contracts that use libraries)
  if (contract.linkedLibraries && contract.linkedLibraries.length > 0) {
    for (const lib of contract.linkedLibraries) {
      cmd.push(`--libraries "${lib.sourceFile}:${lib.name}:${lib.address}"`)
    }
  }

  const fullCmd = cmd.join(' ')

  // Set FOUNDRY_PROFILE environment variable for proper compilation settings
  const env = { ...process.env }
  if (contract.foundryProfile) {
    env.FOUNDRY_PROFILE = contract.foundryProfile
  }

  // Retry loop for handling "Address is not a smart-contract" errors
  for (let attempt = 0; attempt <= VERIFICATION_MAX_RETRIES; attempt++) {
    try {
      await execAsync(fullCmd, {
        cwd: process.cwd(),
        timeout: 180000, // 3 minute timeout
        env,
      })

      process.stdout.write(' Celoscan ✓')
      return true
    } catch (error: any) {
      const isRetryable = isRetryableVerificationError(error)
      const hasRetriesLeft = attempt < VERIFICATION_MAX_RETRIES

      if (isRetryable && hasRetriesLeft) {
        const delay = getRetryDelay(attempt)
        process.stdout.write(` (retry ${attempt + 1}...)`)
        await sleep(delay)
        continue
      }

      process.stdout.write(' Celoscan ✗')
      return false
    }
  }

  return false
}

// Helper to sleep for a given number of milliseconds
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// Retry configuration for verification
const VERIFICATION_MAX_RETRIES = 6
const VERIFICATION_INITIAL_DELAY_MS = 5000 // 5 seconds
const VERIFICATION_MAX_DELAY_MS = 60000 // 1 minute

// Calculate logarithmic delay: 5s, 10s, 20s, 40s... capped at 60s
const getRetryDelay = (attempt: number): number => {
  const delay = VERIFICATION_INITIAL_DELAY_MS * Math.pow(2, attempt)
  return Math.min(delay, VERIFICATION_MAX_DELAY_MS)
}

// Check if error is retryable (block explorer hasn't indexed the contract yet)
const isRetryableVerificationError = (error: any): boolean => {
  const errorMessage = error?.message || ''
  const stdout = error?.stdout || ''
  const stderr = error?.stderr || ''
  const fullMessage = `${errorMessage} ${stdout} ${stderr}`.toLowerCase()

  return (
    fullMessage.includes('address is not a smart-contract') ||
    fullMessage.includes('contract not found') ||
    fullMessage.includes('not yet indexed')
  )
}

// Helper to encode constructor args for verification
const encodeConstructorArgs = (args: any[]): string | null => {
  if (!args || args.length === 0) return null

  try {
    // For simple boolean args (our common case: [false])
    if (args.length === 1 && typeof args[0] === 'boolean') {
      // false encodes to 0x0000...0000 (32 bytes of zeros)
      // true encodes to 0x0000...0001 (31 bytes of zeros + 1)
      return args[0]
        ? '0x0000000000000000000000000000000000000000000000000000000000000001'
        : '0x0000000000000000000000000000000000000000000000000000000000000000'
    }

    // For other cases, we'd need more sophisticated encoding
    // This could be extended as needed
    console.warn('Complex constructor args may need manual encoding')
    return null
  } catch (e) {
    console.warn('Failed to encode constructor args:', e)
    return null
  }
}

const verifyAllContracts = async (
  networkName: string,
  rpcUrl: string,
  celoscanApiKey?: string
): Promise<void> => {
  const config = getVerificationConfig(networkName)

  if (!config) {
    console.log('\nSkipping verification (not supported for this network/fork)')
    return
  }

  if (deployedContracts.length === 0) {
    console.log('\nNo contracts to verify')
    return
  }

  // Set API key if provided
  if (celoscanApiKey) {
    config.celoscanApiKey = celoscanApiKey
  }

  console.log(`\nVerifying ${deployedContracts.length} contract(s) on ${networkName}...`)

  // Wait for block explorers to index the contracts
  process.stdout.write(`Waiting for indexing...`)
  await new Promise((resolve) => setTimeout(resolve, 30000))
  console.log(` done\n`)

  let blockscoutSuccess = 0
  let celoscanSuccess = 0

  for (const contract of deployedContracts) {
    // Single line per contract: Name (address) -> verification results
    process.stdout.write(`  ${contract.name} (${contract.address.slice(0, 10)}...)`)

    // Verify on Blockscout first (no API key needed)
    const blockscoutResult = await verifyContractOnBlockscout(contract, config, rpcUrl)
    if (blockscoutResult) blockscoutSuccess++

    // Then verify on Celoscan (needs API key)
    const celoscanResult = await verifyContractOnCeloscan(contract, config, rpcUrl)
    if (celoscanResult) celoscanSuccess++

    console.log() // newline after each contract
  }

  console.log(
    `\nVerified: Blockscout ${blockscoutSuccess}/${deployedContracts.length}, Celoscan ${celoscanSuccess}/${deployedContracts.length}`
  )
}

function bigIntReplacer(_key: string, value: any): unknown {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

let ignoredContractsSet = new Set()

class ContractAddresses {
  static async create(
    contracts: string[],
    publicClient: PublicClientMethods,
    _registryAbi: Abi, // Kept for API compatibility, uses registryGetAddressAbi internally
    registryAddress: ViemAddress,
    libraryAddresses: LibraryAddresses['addresses']
  ) {
    const addresses = new Map<string, string>()
    await Promise.all(
      contracts.map(async (contract: string) => {
        try {
          // Use low-level call to avoid viem's strict readContract typing
          const callData = encodeFunctionData({
            abi: registryGetAddressAbi,
            functionName: 'getAddressForString',
            args: [contract],
          })
          const result = await publicClient.call({
            to: registryAddress,
            data: callData,
          })
          const registeredAddress = result.data
            ? decodeFunctionResult({
                abi: registryGetAddressAbi,
                functionName: 'getAddressForString',
                data: result.data,
              })
            : NULL_ADDRESS
          if (registeredAddress && !eqAddress(registeredAddress, NULL_ADDRESS)) {
            addresses.set(contract, registeredAddress)
          }
        } catch (error) {
          /* Ignore error if contract not in registry */
        }
      })
    )
    Object.entries(libraryAddresses).forEach(([library, address]) =>
      addresses.set(library, address as string)
    )
    return new ContractAddresses(addresses)
  }

  constructor(public addresses: Map<string, string>) {}

  public get = (contract: string): string => {
    if (this.addresses.has(contract)) {
      return this.addresses.get(contract)!
    } else {
      throw new Error(`Unable to find address for ${contract}`)
    }
  }

  public set = (contract: string, address: string) => {
    this.addresses.set(contract, address)
  }
}

interface ViemContract {
  contractName: string
  address: ViemAddress
  abi: Abi
  bytecode: Hex
  sourceFiles: string[]
  compilerVersion: string
  optimizerEnabled: boolean
  optimizerRuns: number
  evmVersion: string
  foundryProfile?: string // Foundry compilation profile for verification
}

const proxiedCoreContracts = new Set<string>([
  CeloContractName.Accounts,
  CeloContractName.Attestations,
  CeloContractName.BlockchainParameters,
  CeloContractName.DoubleSigningSlasher,
  CeloContractName.DowntimeSlasher,
  CeloContractName.Election,
  CeloContractName.EpochRewards,
  CeloContractName.Escrow,
  CeloContractName.Exchange,
  CeloContractName.ExchangeEUR,
  CeloContractName.ExchangeBRL,
  CeloContractName.FeeCurrencyWhitelist,
  CeloContractName.Freezer,
  CeloContractName.GoldToken,
  CeloContractName.Governance,
  CeloContractName.LockedGold,
  CeloContractName.Random,
  CeloContractName.Reserve,
  CeloContractName.SortedOracles,
  CeloContractName.StableToken,
  CeloContractName.StableTokenEUR,
  CeloContractName.StableTokenBRL,
  CeloContractName.Validators,
  CeloContractName.GrandaMento,
  CeloContractName.FeeHandler,
  CeloContractName.FederatedAttestations,
  CeloContractName.EpochManager,
  CeloContractName.EpochManagerEnabler,
  CeloContractName.ScoreManager,
  CeloContractName.FeeCurrencyDirectory,
  CeloContractName.CeloUnreleasedTreasury,
  CeloContractName.OdisPayments,
])

const isProxiedContract = (
  contractName: string,
  contractArtifactPaths: Map<string, string>
): boolean => {
  return proxiedCoreContracts.has(contractName) || contractArtifactPaths.has(`${contractName}Proxy`)
}

const isCoreContract = (contractName: string) =>
  [...Object.keys(CeloContractName)].includes(contractName)

type ViemAbiConstructor = Extract<Abi[number], { type: 'constructor' }>

type SolidityDefaultValue =
  | bigint
  | boolean
  | string
  | SolidityDefaultValue[]
  | { [key: string]: SolidityDefaultValue }
  | undefined

function getDefaultValueForSolidityType(
  solidityType: string,
  components?: readonly AbiParameter[]
): SolidityDefaultValue {
  if (solidityType.endsWith('[]')) {
    return []
  }

  const fixedArrayMatch = solidityType.match(/^(.*)\[(\d+)\]$/)
  if (fixedArrayMatch) {
    const baseType = fixedArrayMatch[1]
    const size = parseInt(fixedArrayMatch[2], 10)
    const elementComponents = baseType === 'tuple' ? components : undefined
    return Array(size)
      .fill(null)
      .map(() => getDefaultValueForSolidityType(baseType, elementComponents))
  }

  if (solidityType.startsWith('uint') || solidityType.startsWith('int')) {
    return BigInt(0)
  }
  if (solidityType === 'bool') {
    return false
  }
  if (solidityType === 'address') {
    return NULL_ADDRESS
  }
  if (solidityType === 'string') {
    return ''
  }
  if (solidityType.startsWith('bytes')) {
    const sizeMatch = solidityType.match(/^bytes(\d+)$/)
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1], 10)
      return `0x${'00'.repeat(size)}`
    }
    return '0x'
  }

  if (solidityType.startsWith('tuple')) {
    if (!components || components.length === 0) {
      console.warn(
        `Tuple type ${solidityType} has no components defined in ABI input, returning {}.`
      )
      return {}
    }
    const tupleValue: { [key: string]: SolidityDefaultValue } = {}
    for (const component of components) {
      const subComponents =
        'components' in component ? (component.components as readonly AbiParameter[]) : undefined
      tupleValue[component.name!] = getDefaultValueForSolidityType(component.type, subComponents)
    }
    return tupleValue
  }

  console.warn(`Unknown Solidity type for default value: ${solidityType}, returning undefined.`)
  return undefined
}

const deployImplementation = async (
  contractName: string,
  contractArtifact: ViemContract,
  walletClient: WalletClientMethods,
  publicClient: PublicClientMethods,
  requireVersion = true,
  gas?: bigint,
  isLibrary = false,
  linkedLibraries: LinkedLibrary[] = []
): Promise<ViemContract> => {
  let finalConstructorArgs: any[] = []
  const constructorAbiEntry = contractArtifact.abi.find((item) => item.type === 'constructor') as
    | ViemAbiConstructor
    | undefined

  if (constructorAbiEntry && constructorAbiEntry.inputs && constructorAbiEntry.inputs.length > 0) {
    finalConstructorArgs = constructorAbiEntry.inputs.map((input: Readonly<AbiParameter>) => {
      const components =
        'components' in input ? (input.components as readonly AbiParameter[]) : undefined
      return getDefaultValueForSolidityType(input.type, components)
    })
  }

  console.log('Deploying', contractName, 'with derived constructor args:', finalConstructorArgs)

  if (!contractArtifact.bytecode) {
    throw new Error(`Bytecode for ${contractName} is missing.`)
  }

  const hash = await walletClient.deployContract({
    abi: contractArtifact.abi,
    bytecode: contractArtifact.bytecode,
    account: walletClient.account!,
    chain: walletClient.chain!,
    gas: gas ?? BigInt(20_000_000),
    args: finalConstructorArgs,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success' || !receipt.contractAddress) {
    throw new Error(
      `Deployment of ${contractName} failed. Receipt: ${JSON.stringify(receipt, bigIntReplacer)}`
    )
  }
  const deployedAddress = receipt.contractAddress
  console.info(`${contractName} deployed at ${deployedAddress}`)

  if (requireVersion) {
    const getVersionNumberAbiEntry = contractArtifact.abi.find(
      (item: any) => item.type === 'function' && item.name === 'getVersionNumber'
    )
    if (!getVersionNumberAbiEntry) {
      throw new Error(
        `Contract ${contractName} has changes but does not specify a version number in its ABI`
      )
    }
  }

  // Track deployed contract for verification
  // Determine source file from artifact's sourceFiles - find the one containing the contract
  const sourceFile =
    contractArtifact.sourceFiles.find((f) => f.includes(`${contractName}.sol`)) ||
    contractArtifact.sourceFiles[0] ||
    `contracts/${contractName}.sol`

  deployedContracts.push({
    name: contractName,
    address: deployedAddress,
    sourceFile,
    constructorArgs: finalConstructorArgs,
    isLibrary,
    compilerVersion: contractArtifact.compilerVersion,
    optimizerEnabled: contractArtifact.optimizerEnabled,
    optimizerRuns: contractArtifact.optimizerRuns,
    evmVersion: contractArtifact.evmVersion,
    linkedLibraries,
    foundryProfile: contractArtifact.foundryProfile,
  })

  return { ...contractArtifact, address: deployedAddress }
}

const deployProxy = async (
  contractName: string,
  proxyArtifact: ViemContract,
  addresses: ContractAddresses,
  walletClient: WalletClientMethods,
  publicClient: PublicClientMethods,
  gas?: bigint
): Promise<ViemContract> => {
  if (contractName === 'Governance') {
    throw new Error(`Storage incompatible changes to Governance are not yet supported`)
  }
  const proxyContractName = `${contractName}Proxy`
  console.info(`Deploying ${proxyContractName}`)

  if (!proxyArtifact.bytecode) {
    throw new Error(`Bytecode for ${proxyContractName} is missing.`)
  }

  const hash = await walletClient.deployContract({
    abi: proxyArtifact.abi,
    bytecode: proxyArtifact.bytecode,
    account: walletClient.account!,
    chain: walletClient.chain!,
    gas: gas ?? BigInt(20_000_000),
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success' || !receipt.contractAddress) {
    throw new Error(
      `Deployment of ${proxyContractName} failed. Receipt: ${JSON.stringify(
        receipt,
        bigIntReplacer
      )}`
    )
  }
  const proxyAddress = receipt.contractAddress
  console.info(`${proxyContractName} deployed at ${proxyAddress}`)

  const deployedProxyContract = { ...proxyArtifact, address: proxyAddress }

  const governanceAddress = addresses.get('Governance')
  const transferHash = await walletClient.writeContract({
    address: proxyAddress,
    abi: deployedProxyContract.abi,
    functionName: '_transferOwnership',
    args: [governanceAddress],
    account: walletClient.account!,
    chain: walletClient.chain!,
  })
  await publicClient.waitForTransactionReceipt({ hash: transferHash })
  return deployedProxyContract
}

const shouldDeployProxy = (report: ASTDetailedVersionedReport, contractName: string) => {
  const hasStorageChanges = report.contracts[contractName].changes.storage.length > 0
  const isNewContract = report.contracts[contractName].changes.major.find(
    (change: any) => change.type === 'NewContract'
  )
  return hasStorageChanges || isNewContract
}

const deployCoreContract = async (
  contractName: string,
  implementationArtifact: ViemContract,
  proposal: ProposalTx[],
  addresses: ContractAddresses,
  report: ASTDetailedVersionedReport,
  initializationData: Record<string, unknown[]>,
  walletClient: WalletClientMethods,
  publicClient: PublicClientMethods,
  contractArtifactPaths: Map<string, string>,
  linkedLibraries: LinkedLibrary[] = []
) => {
  const deployedImplementation = await deployImplementation(
    contractName,
    implementationArtifact,
    walletClient,
    publicClient,
    true,
    undefined,
    false, // isLibrary
    linkedLibraries
  )

  const setImplementationTx: ProposalTx = {
    contract: `${contractName}Proxy`,
    function: '_setImplementation',
    args: [deployedImplementation.address],
    value: '0',
  }

  if (!shouldDeployProxy(report, contractName)) {
    proposal.push(setImplementationTx)
  } else {
    const proxyArtifactName = `${contractName}Proxy`
    const proxyArtifactPath = contractArtifactPaths.get(proxyArtifactName)
    if (!proxyArtifactPath) {
      throw new Error(`Proxy artifact ${proxyArtifactName} not found in artifact map.`)
    }
    let proxyArtifact: ViemContract
    try {
      proxyArtifact = loadContractArtifact(proxyArtifactName, proxyArtifactPath)
    } catch (e) {
      throw new Error(
        `Failed to load proxy artifact ${proxyArtifactName} from ${proxyArtifactPath}. Error: ${e}`
      )
    }
    const deployedProxy = await deployProxy(
      contractName,
      proxyArtifact,
      addresses,
      walletClient,
      publicClient
    )

    addresses.set(contractName, deployedProxy.address)
    proposal.push({
      contract: 'Registry',
      function: 'setAddressFor',
      args: [contractName, deployedProxy.address],
      value: '0',
      description: `Registry: ${contractName} -> ${deployedProxy.address}`,
    })

    const initializeAbiEntry = implementationArtifact.abi.find(
      (item: any) => item.type === 'function' && item.name === 'initialize'
    )

    if (initializeAbiEntry) {
      const initArgs = initializationData[contractName]
      if (initArgs) {
        let callData: Hex
        try {
          callData = encodeFunctionData({
            abi: implementationArtifact.abi,
            functionName: 'initialize',
            args: initArgs,
          })
        } catch (error) {
          throw new Error(
            `Tried to encode initialize for ${contractName} with args: ${JSON.stringify(
              initArgs
            )}. Error: ${error}. ABI: ${JSON.stringify(initializeAbiEntry)}`
          )
        }
        setImplementationTx.function = '_setAndInitializeImplementation'
        setImplementationTx.args.push(callData)
      } else {
        console.warn(`No initialization data found for ${contractName}. Skipping initialization.`)
      }
    }
    console.info(
      `Add '${contractName}Proxy.${setImplementationTx.function}' with args ${JSON.stringify(
        setImplementationTx.args
      )} to proposal`
    )
    console.log('Deployed', contractName)
    proposal.push(setImplementationTx)
  }
}

const deployLibrary = async (
  libraryName: string,
  libraryArtifact: ViemContract,
  addresses: ContractAddresses,
  walletClient: WalletClientMethods,
  publicClient: PublicClientMethods
): Promise<void> => {
  const deployedLibrary = await deployImplementation(
    libraryName,
    libraryArtifact,
    walletClient,
    publicClient,
    false,
    undefined,
    true // isLibrary = true
  )
  addresses.set(libraryName, deployedLibrary.address.substring(2))
}

export interface ProposalTx {
  contract: string
  function: string
  args: string[]
  value: string
  description?: string
}

const getViemChain = (networkName: string): Chain => {
  switch (networkName.toLowerCase()) {
    case 'celo':
    case 'mainnet':
    case 'rc1':
      return viemChains.celo
    case 'celo-sepolia':
      return defineChain({
        id: 11142220,
        name: 'Celo Sepolia',
        nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
        },
        blockExplorers: {
          default: { name: 'CeloScan', url: 'https://celo-sepolia.blockscout.com' },
        },
        testnet: true,
      })
    default:
      return { ...viemChains.hardhat, id: 31337 }
  }
}

const loadContractArtifact = (contractName: string, artifactPath: string): ViemContract => {
  console.log('loadContractArtifact', contractName, artifactPath)
  const artifact = readJsonSync(artifactPath) as ForgeArtifact
  const sourceFiles = Object.keys(artifact.metadata.sources)

  // Extract compiler settings from metadata
  const compiler = artifact.metadata?.compiler || {}
  const settings = artifact.metadata?.settings || {}
  const optimizer = settings.optimizer || { enabled: true, runs: 200 }

  // Use full compiler version (e.g., "0.5.14+commit.01f1aaa4") for verification
  // Etherscan may require the full version to properly verify
  const fullVersion = compiler.version || '0.8.19'

  // Determine foundry profile based on source file paths
  // contracts/ = truffle-compat (Solidity 0.5.x)
  // contracts-0.8/ = truffle-compat8 (Solidity 0.8.x)
  let foundryProfile: string | undefined
  const mainSourceFile =
    sourceFiles.find((f) => f.includes(`${contractName}.sol`)) || sourceFiles[0]
  if (mainSourceFile) {
    if (mainSourceFile.startsWith('contracts-0.8/')) {
      foundryProfile = 'truffle-compat8'
    } else if (mainSourceFile.startsWith('contracts/')) {
      foundryProfile = 'truffle-compat'
    }
  }

  return {
    contractName,
    abi: artifact.abi as Abi,
    bytecode: artifact.bytecode.object,
    address: '0x0' as ViemAddress,
    sourceFiles,
    compilerVersion: fullVersion,
    optimizerEnabled: optimizer.enabled ?? true,
    optimizerRuns: optimizer.runs ?? 200,
    evmVersion: settings.evmVersion || 'paris',
    foundryProfile,
  }
}

const findContractArtifacts = (baseDir: string, contractArtifactPathsMap: Map<string, string>) => {
  const entries = readdirSync(baseDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.endsWith('.sol')) {
      continue
    }
    const contractSolDirPath = join(baseDir, entry.name as string)
    const filesInSolDir = readdirSync(contractSolDirPath, { withFileTypes: true })

    for (const fileEntry of filesInSolDir) {
      if (!fileEntry.isFile() || !fileEntry.name.endsWith('.json')) {
        continue
      }

      const contractName = basename(fileEntry.name as string, '.json')
      const artifactFilePath = join(contractSolDirPath, fileEntry.name as string)

      try {
        const content = readJsonSync(artifactFilePath)
        if (content.abi && content.bytecode) {
          contractArtifactPathsMap.set(contractName, artifactFilePath)
        } else {
          console.warn(`Skipping non-ABI/bytecode file: ${artifactFilePath}`)
        }
      } catch (e) {
        console.warn(`Skipping non-JSON or unreadable file: ${artifactFilePath}`)
      }
    }
  }
}

const linkLibraries = (
  contractViemArtifact: ViemContract,
  contractDependencies: string[],
  addresses: ContractAddresses
): LinkedLibrary[] => {
  const linkedLibraries: LinkedLibrary[] = []

  if (!contractViemArtifact.bytecode.includes('__')) {
    return linkedLibraries
  }

  if (contractDependencies.length === 0) {
    console.error(
      `No dependencies found for ${contractViemArtifact.contractName}. Skipping library linking.`
    )
    return linkedLibraries
  }

  for (const dep of contractDependencies) {
    if (addresses.addresses.has(dep)) {
      const libAddressWithPrefix = addresses.get(dep)
      const libAddress = libAddressWithPrefix.replace('0x', '')
      const libSourceFilePath = contractViemArtifact.sourceFiles.find((file) =>
        file.includes(`${dep}.sol`)
      )

      if (!libSourceFilePath) {
        throw new Error(
          `Could not determine sourceFilePath for library ${dep} in ${contractViemArtifact.contractName}.`
        )
      }

      const stringToHash = `${libSourceFilePath}:${dep}`
      const hashed = keccak256(toHex(new TextEncoder().encode(stringToHash)))
      const placeholderHash = hashed.substring(2, 2 + 34)

      const placeholderRegexDollar = new RegExp(`__\\$${placeholderHash}\\$__`, 'g')
      if (contractViemArtifact.bytecode!.match(placeholderRegexDollar)) {
        contractViemArtifact.bytecode = contractViemArtifact.bytecode!.replace(
          placeholderRegexDollar,
          libAddress
        ) as Hex

        // Track the linked library for verification
        // Ensure the address has 0x prefix for verification
        const fullAddress = libAddressWithPrefix.startsWith('0x')
          ? libAddressWithPrefix
          : `0x${libAddressWithPrefix}`
        linkedLibraries.push({
          sourceFile: libSourceFilePath,
          name: dep,
          address: fullAddress,
        })
      } else {
        console.log(`No placeholder match for ${dep} in ${contractViemArtifact.contractName}.`)
      }
    }
  }

  return linkedLibraries
}

const performRelease = async (
  contractName: string,
  report: ASTDetailedVersionedReport,
  released: Set<string>,
  contractArtifactPaths: Map<string, string>,
  dependencies: { get(key: string): string[] | undefined },
  addresses: ContractAddresses,
  proposal: ProposalTx[],
  initializationData: Record<string, unknown[]>,
  walletClient: WalletClientMethods,
  publicClient: PublicClientMethods
): Promise<void> => {
  if (released.has(contractName)) return

  const shouldDeployContract = Object.keys(report.contracts).includes(contractName)
  const shouldDeployLibrary = Object.keys(report.libraries).includes(contractName)

  if (!shouldDeployContract && !shouldDeployLibrary) return

  const artifactPath = contractArtifactPaths.get(contractName)
  if (!artifactPath) {
    throw new Error(`Artifact path for ${contractName} not found in map.`)
  }

  let contractViemArtifact: ViemContract
  try {
    contractViemArtifact = loadContractArtifact(contractName, artifactPath)
  } catch (e) {
    throw new Error(
      `Failed to load artifact for ${contractName} from ${artifactPath}. Skipping. Error: ${e}`
    )
  }

  if (shouldDeployContract) {
    const contractDependencies = dependencies.get(contractName) || []
    for (const dependency of contractDependencies) {
      if (!released.has(dependency)) {
        await performRelease(
          dependency,
          report,
          released,
          contractArtifactPaths,
          dependencies,
          addresses,
          proposal,
          initializationData,
          walletClient,
          publicClient
        )
      }
    }

    const linkedLibraries = linkLibraries(contractViemArtifact, contractDependencies, addresses)

    await deployCoreContract(
      contractName,
      contractViemArtifact,
      proposal,
      addresses,
      report,
      initializationData,
      walletClient,
      publicClient,
      contractArtifactPaths,
      linkedLibraries
    )
  } else if (shouldDeployLibrary) {
    await deployLibrary(contractName, contractViemArtifact, addresses, walletClient, publicClient)
  }
  released.add(contractName)
}

async function main() {
  try {
    const argv: MakeReleaseArgv = yargs(hideBin(process.argv) as string[])
      .option('report', {
        type: 'string',
        demandOption: true,
        description: 'Path to the compatibility report JSON file.',
      })
      .option('proposal', {
        type: 'string',
        demandOption: true,
        description: 'Path to output the proposal JSON file.',
      })
      .option('librariesFile', {
        type: 'string',
        demandOption: true,
        description: 'Path to the libraries.json file.',
      })
      .option('initializeData', {
        type: 'string',
        demandOption: true,
        description: 'Path to the JSON file with initialization data for contracts.',
      })
      .option('buildDirectory', {
        type: 'string',
        demandOption: true,
        description: 'Path to the Foundry build output directory (e.g., out/).',
      })
      .option('branch', {
        type: 'string',
        demandOption: true,
        description: 'Git branch name (used for versioning).',
      })
      .option('network', {
        type: 'string',
        demandOption: true,
        description: 'Network name (e.g., celo-sepolia, celo, mainnet).',
      })
      .option('privateKey', { type: 'string', description: 'Private key for deployment.' })
      .option('mnemonic', { type: 'string', description: 'Mnemonic for deployment.' })
      .option('rpcUrl', {
        type: 'string',
        description: 'Custom RPC URL (overrides network default, useful for local anvil forks).',
      })
      .option('skipVerification', {
        type: 'boolean',
        default: false,
        description: 'Skip contract verification on block explorers.',
      })
      .option('celoscanApiKey', {
        type: 'string',
        description:
          'Celoscan API key for contract verification (can also be set via CELOSCAN_API_KEY env var or .env.json).',
      })
      .check((currentArgs) => {
        if (!currentArgs.privateKey && !currentArgs.mnemonic) {
          throw new Error('Either --privateKey or --mnemonic must be provided.')
        }
        return true
      }).argv

    const networkName = argv.network!
    const buildDir = argv.buildDirectory
    if (!existsSync(buildDir)) {
      throw new Error(`${buildDir} directory not found. Make sure to run foundry build first`)
    }

    // Check for Celoscan API key early (before deployment) for production networks
    const isProductionNetwork = ['celo', 'mainnet', 'rc1', 'celo-sepolia'].includes(
      networkName.toLowerCase()
    )
    const isLocalFork = !!argv.rpcUrl

    if (isProductionNetwork && !isLocalFork && !argv.skipVerification) {
      // Load Celoscan API key from various sources
      let celoscanApiKey = argv.celoscanApiKey || process.env.CELOSCAN_API_KEY

      // Try loading from .env.json if not set
      if (!celoscanApiKey) {
        const envJsonPath = join(process.cwd(), '.env.json')
        if (existsSync(envJsonPath)) {
          try {
            const envJson = readJsonSync(envJsonPath)
            celoscanApiKey = envJson.celoScanApiKey || envJson.celoscanApiKey
          } catch (e) {
            // Ignore error, will check below
          }
        }
      }

      if (!celoscanApiKey) {
        throw new Error(
          `Celoscan API key is required for ${networkName}. ` +
            `Provide it via:\n` +
            `  - CLI flag: -a YOUR_API_KEY\n` +
            `  - Environment variable: CELOSCAN_API_KEY\n` +
            `  - Config file: packages/protocol/.env.json (celoScanApiKey)\n` +
            `Or use --skipVerification (-s) to skip verification.`
        )
      }
    }

    const viemChain = getViemChain(networkName)

    // Use custom rpcUrl if provided, otherwise use chain default
    let transportUrl: string
    if (argv.rpcUrl) {
      transportUrl = argv.rpcUrl
      console.log(`Using custom RPC URL: ${transportUrl}`)
    } else if (viemChain.rpcUrls.default?.http?.[0]) {
      transportUrl = viemChain.rpcUrls.default.http[0]
    } else {
      throw new Error(
        `RPC URL for network ${networkName} could not be determined. Provide --rpcUrl parameter.`
      )
    }
    const publicClient = createPublicClient({
      chain: viemChain,
      transport: http(transportUrl),
    })

    let account: Account

    if (argv.privateKey) {
      const privateKey = argv.privateKey.startsWith('0x')
        ? (argv.privateKey as Hex)
        : (`0x${argv.privateKey}` as Hex)
      account = privateKeyToAccount(privateKey)
    } else {
      account = mnemonicToAccount(argv.mnemonic as string)
    }

    const walletClient = createWalletClient({
      account,
      chain: viemChain,
      transport: http(transportUrl),
    })
    const fullReport = readJsonSync(argv.report)
    const libraryMapping: LibraryAddresses['addresses'] = readJsonSync(argv.librariesFile)
    const report: ASTDetailedVersionedReport = fullReport.report
    const branch = (argv.branch ?? '') as string
    const initializationData: Record<string, unknown[]> = readJsonSync(String(argv.initializeData))
    const dependencies = getCeloContractDependencies()
    const version = getReleaseVersion(branch)

    if (version >= 9) {
      ignoredContractsSet = new Set(ignoredContractsV9)
    }

    const contractArtifactPaths = new Map<string, string>()

    findContractArtifacts(buildDir, contractArtifactPaths)

    if (contractArtifactPaths.size === 0) {
      console.warn(
        `No contract artifacts found in ${buildDir}. Ensure the directory is correct and contains Foundry outputs.`
      )
    }

    const registryArtifactPath = contractArtifactPaths.get('Registry')
    if (!registryArtifactPath) {
      throw new Error(
        `Registry.json artifact not found in ${buildDir} or its subdirectories. ` +
          `Please ensure it is compiled and present in the Foundry output format (e.g., ${String(
            buildDir
          )}/Registry.sol/Registry.json).`
      )
    }
    const registryArtifact = loadContractArtifact('Registry', registryArtifactPath)

    const allContractNames = Array.from(contractArtifactPaths.keys()).filter(
      (contractName) =>
        !ignoredContractsSet.has(contractName) &&
        !ignoredContractsSet.has(contractName.replace('Proxy', ''))
    )

    const addresses = await ContractAddresses.create(
      allContractNames,
      publicClient,
      registryArtifact.abi,
      celoRegistryAddress as ViemAddress,
      libraryMapping
    )

    const released: Set<string> = new Set([])
    const proposal: ProposalTx[] = []

    for (const contractName of allContractNames) {
      if (isCoreContract(contractName) && isProxiedContract(contractName, contractArtifactPaths)) {
        await performRelease(
          contractName,
          report,
          released,
          contractArtifactPaths,
          dependencies,
          addresses,
          proposal,
          initializationData,
          walletClient,
          publicClient
        )
      }
    }

    writeJsonSync(argv.proposal, proposal, { spaces: 2 })
    console.log(`Proposal successfully written to ${argv.proposal}`)

    // Contract verification
    if (isLocalFork) {
      console.log('\nContract verification skipped (custom RPC URL indicates local fork)')
    } else if (argv.skipVerification) {
      console.log('\nContract verification skipped (--skipVerification flag)')
    } else {
      // Load Celoscan API key (already validated at start for production networks)
      let celoscanApiKey = argv.celoscanApiKey || process.env.CELOSCAN_API_KEY

      if (!celoscanApiKey) {
        const envJsonPath = join(process.cwd(), '.env.json')
        if (existsSync(envJsonPath)) {
          try {
            const envJson = readJsonSync(envJsonPath)
            celoscanApiKey = envJson.celoScanApiKey || envJson.celoscanApiKey
          } catch (e) {
            // Ignore - already validated for production networks
          }
        }
      }

      await verifyAllContracts(networkName, transportUrl, celoscanApiKey)
    }
  } catch (error) {
    console.error('Error during script execution:', error)
  }
}

main().catch((error) => {
  console.error('Unhandled error in main execution:', error)
  process.exit(1)
})
