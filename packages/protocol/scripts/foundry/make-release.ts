/* eslint-disable no-console */
import { LibraryAddresses } from '@celo/protocol/lib/bytecode'
import { ASTDetailedVersionedReport } from '@celo/protocol/lib/compatibility/report'
import { getCeloContractDependencies } from '@celo/protocol/lib/contract-dependencies'
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { ForgeArtifact } from '@celo/protocol/scripts/ForgeArtifact'
import { NULL_ADDRESS, eqAddress } from '@celo/utils/lib/address'
import { readJsonSync, readdirSync, writeJsonSync } from 'fs-extra'
import { basename, join } from 'path'
import { TextEncoder } from 'util'
import {
  Abi,
  AbiParameter,
  Account,
  Chain,
  Hex,
  PublicClient,
  Address as ViemAddress,
  WalletClient,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  keccak256,
  toHex,
} from 'viem'
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts'
import * as viemChains from 'viem/chains'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { getReleaseVersion, ignoredContractsV9 } from '../../lib/compatibility/ignored-contracts-v9'

interface MakeReleaseArgv {
  report: string
  from?: string
  proposal: string
  librariesFile: string
  initialize_data: string
  build_directory: string
  branch?: string
  network: string
  privateKey?: string
  mnemonic?: string
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
    publicClient: PublicClient,
    registryAbi: Abi,
    registryAddress: ViemAddress,
    libraryAddresses: LibraryAddresses['addresses']
  ) {
    const addresses = new Map<string, string>()
    await Promise.all(
      contracts.map(async (contract: string) => {
        try {
          const registeredAddress = (await publicClient.readContract({
            address: registryAddress,
            abi: registryAbi,
            functionName: 'getAddressForString',
            args: [contract],
          })) as string
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

  constructor(public addresses: Map<string, string>) { }

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
  | undefined;

function getDefaultValueForSolidityType(
  solidityType: string,
  components?: readonly AbiParameter[]
): SolidityDefaultValue {
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
  walletClient: WalletClient,
  publicClient: PublicClient,
  requireVersion = true,
  gas?: bigint
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
  return { ...contractArtifact, address: deployedAddress }
}

const deployProxy = async (
  contractName: string,
  proxyArtifact: ViemContract,
  addresses: ContractAddresses,
  walletClient: WalletClient,
  publicClient: PublicClient,
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
    gas: gas ?? BigInt(3000000),
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
  walletClient: WalletClient,
  publicClient: PublicClient,
  contractArtifactPaths: Map<string, string>
) => {
  const deployedImplementation = await deployImplementation(
    contractName,
    implementationArtifact,
    walletClient,
    publicClient,
    true,
    undefined
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
  walletClient: WalletClient,
  publicClient: PublicClient
): Promise<void> => {
  const deployedLibrary = await deployImplementation(
    libraryName,
    libraryArtifact,
    walletClient,
    publicClient,
    false
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
    case 'alfajores':
      return viemChains.celoAlfajores
    case 'celo':
    case 'mainnet':
    case 'rc1':
      return viemChains.celo
    case 'baklava':
      return {
        id: 62320,
        name: 'Celo Baklava',
        nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://baklava-forno.celo-testnet.org'] },
          public: { http: ['https://baklava-forno.celo-testnet.org'] },
        },
        blockExplorers: { default: { name: 'CeloScan', url: 'https://baklava.celoscan.io' } },
        testnet: true,
      }
    default:
      return { ...viemChains.hardhat, id: 31337 }
  }
}

const loadContractArtifact = (contractName: string, artifactPath: string): ViemContract => {
  console.log('loadContractArtifact', contractName, artifactPath)
  const artifact = readJsonSync(artifactPath) as ForgeArtifact
  const sourceFiles = Object.keys(artifact.metadata.sources)
  return {
    contractName,
    abi: artifact.abi as Abi,
    bytecode: artifact.bytecode.object,
    address: '0x0' as ViemAddress,
    sourceFiles,
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
): void => {
  if (!contractViemArtifact.bytecode.includes('__')) {
    return
  }

  if (contractDependencies.length === 0) {
    console.error(
      `No dependencies found for ${contractViemArtifact.contractName}. Skipping library linking.`
    )
    return
  }

  for (const dep of contractDependencies) {
    if (addresses.addresses.has(dep)) {
      const libAddress = addresses.get(dep).replace('0x', '')
      const libSourceFilePath = contractViemArtifact.sourceFiles.find((file) =>
        file.includes(`${dep}.sol`)
      )

      if (!libSourceFilePath) {
        console.error(
          `Could not determine sourceFilePath for library ${dep}. Skipping Foundry placeholder replacement for it in ${contractViemArtifact.contractName}.`
        )
        return
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
      } else {
        console.log(`No placeholder match for ${dep} in ${contractViemArtifact.contractName}.`)
      }
    }
  }
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
  walletClient: WalletClient,
  publicClient: PublicClient
): Promise<void> => {
  if (released.has(contractName)) return

  const shouldDeployContract = Object.keys(report.contracts).includes(contractName)
  const shouldDeployLibrary = Object.keys(report.libraries).includes(contractName)

  if (!shouldDeployContract && !shouldDeployLibrary) return

  const artifactPath = contractArtifactPaths.get(contractName)
  if (!artifactPath) {
    console.error(`Artifact path for ${contractName} not found in map. Skipping.`)
    released.add(contractName)
    return
  }

  let contractViemArtifact: ViemContract
  try {
    contractViemArtifact = loadContractArtifact(contractName, artifactPath)
  } catch (e) {
    console.error(
      `Failed to load artifact for ${contractName} from ${artifactPath}. Skipping. Error: ${e}`
    )
    released.add(contractName)
    return
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

    linkLibraries(contractViemArtifact, contractDependencies, addresses)

    await deployCoreContract(
      contractName,
      contractViemArtifact,
      proposal,
      addresses,
      report,
      initializationData,
      walletClient,
      publicClient,
      contractArtifactPaths
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
      .option('from', {
        type: 'string',
        description:
          'Address to deploy from (not directly used in this script but kept for compatibility or future use).',
      })
      .option('proposal', {
        type: 'string',
        demandOption: true,
        description: 'Path to output the proposal JSON file.',
      })
      .option('librariesFile', {
        type: 'string',
        default: 'libraries.json',
        description: 'Path to the libraries.json file.',
      })
      .option('initialize_data', {
        type: 'string',
        demandOption: true,
        description: 'Path to the JSON file with initialization data for contracts.',
      })
      .option('build_directory', {
        type: 'string',
        demandOption: true,
        description: 'Path to the Foundry build output directory (e.g., out/).',
      })
      .option('branch', { type: 'string', description: 'Git branch name (used for versioning).' })
      .option('network', {
        type: 'string',
        default: 'development',
        description: 'Network name (e.g., alfajores, mainnet, development).',
      })
      .option('privateKey', { type: 'string', description: 'Private key for deployment.' })
      .option('mnemonic', { type: 'string', description: 'Mnemonic for deployment.' })
      .check((currentArgs) => {
        if (!currentArgs.privateKey && !currentArgs.mnemonic) {
          throw new Error('Either --privateKey or --mnemonic must be provided.')
        }
        return true
      }).argv

    const networkName = argv.network!
    const buildDir = argv.build_directory
    const viemChain = getViemChain(networkName)

    if (!viemChain.rpcUrls.default?.http?.[0]) {
      throw new Error(`RPC URL for network ${networkName} could not be determined.`)
    }

    const transportUrl = viemChain.rpcUrls.default.http[0]
    const publicClientInternal = createPublicClient({
      chain: viemChain,
      transport: http(transportUrl),
    })

    const publicClient = {
      ...publicClientInternal,
      account: undefined,
    } as PublicClient
    let account: Account

    if (argv.privateKey) {
      account = privateKeyToAccount(argv.privateKey as Hex)
    } else if (argv.mnemonic) {
      account = mnemonicToAccount(argv.mnemonic as string)
    } else {
      throw new Error('Deployment requires a signer. Please provide --privateKey or --mnemonic.')
    }

    const walletClient = createWalletClient({
      account,
      chain: viemChain,
      transport: http(transportUrl),
    })
    const fullReport = readJsonSync(argv.report)
    const libraryMapping: LibraryAddresses['addresses'] = readJsonSync(
      argv.librariesFile ?? 'libraries.json'
    )
    const report: ASTDetailedVersionedReport = fullReport.report
    const branch = (argv.branch ? argv.branch : '') as string
    const initializationData: Record<string, unknown[]> = readJsonSync(String(argv.initialize_data))
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
        `Please ensure it is compiled and present in the Foundry output format (e.g., ${String(buildDir)}/Registry.sol/Registry.json).`
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
  } catch (error) {
    console.error('Error during script execution:', error)
  }
}

main().catch((error) => {
  console.error('Unhandled error in main execution:', error)
  process.exit(1)
})
