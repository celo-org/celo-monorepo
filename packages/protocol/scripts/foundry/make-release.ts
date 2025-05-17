/* eslint-disable max-classes-per-file: 0 */
/* eslint-disable no-console: 0 */
/* eslint:disabled ordered-imports: 0 */
import { LibraryAddresses } from '@celo/protocol/lib/bytecode';
import { ASTDetailedVersionedReport } from '@celo/protocol/lib/compatibility/report';
import { getCeloContractDependencies } from '@celo/protocol/lib/contract-dependencies';
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils';
import { ForgeArtifact } from '@celo/protocol/scripts/FoundryArtifact';
import { NULL_ADDRESS, eqAddress } from '@celo/utils/lib/address';
import { readJsonSync, readdirSync, writeJsonSync } from 'fs-extra';
import { basename, join } from 'path';
import { TextEncoder } from 'util';
import {
  Abi,
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
} from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import * as viemChains from 'viem/chains';
import { getReleaseVersion, ignoredContractsV9 } from '../../lib/compatibility/ignored-contracts-v9';


function bigIntReplacer(_key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

let ignoredContractsSet = new Set();

class ContractAddresses {
  static async create(
    contracts: string[],
    publicClient: PublicClient,
    registryAbi: Abi,
    registryAddress: ViemAddress,
    libraryAddresses: LibraryAddresses['addresses']
  ) {
    const addresses = new Map<string, string>();
    await Promise.all(
      contracts.map(async (contract: string) => {
        try {
          const registeredAddress = await publicClient.readContract({
            address: registryAddress,
            abi: registryAbi,
            functionName: 'getAddressForString',
            args: [contract],
          }) as string;
          if (registeredAddress && !eqAddress(registeredAddress, NULL_ADDRESS)) {
            addresses.set(contract, registeredAddress);
          }
        } catch (error) { /* Ignore error if contract not in registry */ }
      })
    );
    Object.entries(libraryAddresses).forEach(([library, address]) =>
      addresses.set(library, address as string)
    );
    return new ContractAddresses(addresses);
  }

  constructor(public addresses: Map<string, string>) { }

  public get = (contract: string): string => {
    if (this.addresses.has(contract)) {
      return this.addresses.get(contract)!;
    } else {
      throw new Error(`Unable to find address for ${contract}`);
    }
  };

  public set = (contract: string, address: string) => {
    this.addresses.set(contract, address);
  };
}

interface ViemContract {
  address: ViemAddress;
  abi: Abi;
  bytecode: Hex;
  sourceFiles: string[];
}

// Define the set of core contracts that are proxied
const proxiedCoreContracts = new Set<CeloContractName>([
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
]);

const isProxiedContract = (contractName: string): boolean => {
  // Check if the contract name is one of the known proxied core contracts
  return proxiedCoreContracts.has(contractName as CeloContractName);
};

const isCoreContract = (contractName: string) => Object.keys(CeloContractName).includes(contractName);

const deployImplementation = async (
  contractName: string,
  contractArtifact: ViemContract,
  walletClient: WalletClient,
  publicClient: PublicClient,
  requireVersion = true,
  gas?: bigint,
  constructorArgs?: any[]
): Promise<ViemContract> => {
  console.log("Deploying", contractName, "with constructor args", constructorArgs);

  if (!contractArtifact.bytecode) {
    throw new Error(`Bytecode for ${contractName} is missing.`);
  }

  let deployedAddress: ViemAddress;
  const hash = await walletClient.deployContract({
    abi: contractArtifact.abi,
    bytecode: contractArtifact.bytecode,
    account: walletClient.account!,
    chain: walletClient.chain!,
    gas: gas ?? BigInt(20_000_000),
    args: constructorArgs, // Pass constructorArgs here
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success' || !receipt.contractAddress) {
    throw new Error(`Deployment of ${contractName} failed. Receipt: ${JSON.stringify(receipt, bigIntReplacer)}`);
  }
  deployedAddress = receipt.contractAddress;
  console.info(`${contractName} deployed at ${deployedAddress}`);

  if (requireVersion) {
    const getVersionNumberAbiEntry = contractArtifact.abi.find(
      (item: any) => item.type === 'function' && item.name === 'getVersionNumber'
    );
    if (!getVersionNumberAbiEntry) {
      throw new Error(`Contract ${contractName} has changes but does not specify a version number in its ABI`);
    }
  }
  return { ...contractArtifact, address: deployedAddress };
};

const deployProxy = async (
  contractName: string,
  proxyArtifact: ViemContract,
  addresses: ContractAddresses,
  walletClient: WalletClient,
  publicClient: PublicClient,
  gas?: bigint
): Promise<ViemContract> => {
  if (contractName === 'Governance') {
    throw new Error(`Storage incompatible changes to Governance are not yet supported`);
  }
  const proxyContractName = `${contractName}Proxy`;
  console.info(`Deploying ${proxyContractName}`);

  if (!proxyArtifact.bytecode) {
    throw new Error(`Bytecode for ${proxyContractName} is missing.`);
  }

  let proxyAddress: ViemAddress;
  const hash = await walletClient.deployContract({
    abi: proxyArtifact.abi,
    bytecode: proxyArtifact.bytecode,
    account: walletClient.account!,
    chain: walletClient.chain!,
    gas: gas ?? BigInt(3000000),
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success' || !receipt.contractAddress) {
    throw new Error(`Deployment of ${proxyContractName} failed. Receipt: ${JSON.stringify(receipt, bigIntReplacer)}`);
  }
  proxyAddress = receipt.contractAddress;
  console.info(`${proxyContractName} deployed at ${proxyAddress}`);

  const deployedProxyContract = { ...proxyArtifact, address: proxyAddress };

  const governanceAddress = addresses.get('Governance');
  const transferHash = await walletClient.writeContract({
    address: proxyAddress,
    abi: deployedProxyContract.abi,
    functionName: '_transferOwnership',
    args: [governanceAddress],
    account: walletClient.account!,
    chain: walletClient.chain!,
  });
  await publicClient.waitForTransactionReceipt({ hash: transferHash });
  return deployedProxyContract;
};

const shouldDeployProxy = (report: ASTDetailedVersionedReport, contractName: string) => {
  const hasStorageChanges = report.contracts[contractName].changes.storage.length > 0;
  const isNewContract = report.contracts[contractName].changes.major.find(
    (change: any) => change.type === 'NewContract'
  );
  return hasStorageChanges || isNewContract;
};

const deployCoreContract = async (
  contractName: string,
  implementationArtifact: ViemContract,
  proposal: ProposalTx[],
  addresses: ContractAddresses,
  report: ASTDetailedVersionedReport,
  initializationData: any,
  walletClient: WalletClient,
  publicClient: PublicClient,
  contractArtifactPaths: Map<string, string>
) => {
  const constructorArgs = initializationData[contractName];

  const deployedImplementation = await deployImplementation(
    contractName,
    implementationArtifact,
    walletClient,
    publicClient,
    true, // requireVersion for core contracts
    undefined, // gas (let deployImplementation handle default)
    constructorArgs // Pass constructor arguments
  );

  const setImplementationTx: ProposalTx = {
    contract: `${contractName}Proxy`,
    function: '_setImplementation',
    args: [deployedImplementation.address],
    value: '0',
  };

  if (!shouldDeployProxy(report, contractName)) {
    proposal.push(setImplementationTx);
  } else {
    const proxyArtifactName = `${contractName}Proxy`;
    const proxyArtifactPath = contractArtifactPaths.get(proxyArtifactName);
    if (!proxyArtifactPath) {
      throw new Error(`Proxy artifact ${proxyArtifactName} not found in artifact map.`);
    }
    let proxyArtifact: ViemContract;
    try {
      proxyArtifact = loadContractArtifact(proxyArtifactName, proxyArtifactPath);
    } catch (e) {
      throw new Error(`Failed to load proxy artifact ${proxyArtifactName} from ${proxyArtifactPath}. Error: ${e}`);
    }
    const deployedProxy = await deployProxy(
      contractName,
      proxyArtifact,
      addresses,
      walletClient,
      publicClient,
    );

    addresses.set(contractName, deployedProxy.address);
    proposal.push({
      contract: 'Registry',
      function: 'setAddressFor',
      args: [contractName, deployedProxy.address],
      value: '0',
      description: `Registry: ${contractName} -> ${deployedProxy.address}`,
    });

    const initializeAbiEntry = implementationArtifact.abi.find(
      (item: any) => item.type === 'function' && item.name === 'initialize'
    );

    if (initializeAbiEntry) {
      const initArgs = initializationData[contractName];
      if (initArgs) {
        let callData: Hex;
        try {
          callData = encodeFunctionData({
            abi: implementationArtifact.abi,
            functionName: 'initialize',
            args: initArgs,
          });
        } catch (error) {
          throw new Error(
            `Tried to encode initialize for ${contractName} with args: ${JSON.stringify(
              initArgs
            )}. Error: ${error}. ABI: ${JSON.stringify(initializeAbiEntry)}`
          );
        }
        setImplementationTx.function = '_setAndInitializeImplementation';
        setImplementationTx.args.push(callData);
      }
    }
    // console.info(
    //   `Add '${contractName}Proxy.${setImplementationTx.function}' with args ${JSON.stringify(setImplementationTx.args)} to proposal`
    // );
    console.log("Deployed", contractName);
    proposal.push(setImplementationTx);
  }
};

const deployLibrary = async (
  libraryName: string,
  libraryArtifact: ViemContract,
  addresses: ContractAddresses,
  walletClient: WalletClient,
  publicClient: PublicClient,
): Promise<void> => {
  const deployedLibrary = await deployImplementation(
    libraryName,
    libraryArtifact,
    walletClient,
    publicClient,
    false
  );
  addresses.set(libraryName, deployedLibrary.address.substring(2));
};

export interface ProposalTx {
  contract: string;
  function: string;
  args: string[];
  value: string;
  description?: string;
}

const getViemChain = (networkName: string): Chain => {
  switch (networkName.toLowerCase()) {
    case 'alfajores':
      return viemChains.celoAlfajores;
    case 'celo':
    case 'mainnet':
    case 'rc1':
      return viemChains.celo;
    case 'baklava':
      return {
        id: 62320, network: 'baklava', name: 'Celo Baklava',
        nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
        rpcUrls: { default: { http: ['https://baklava-forno.celo-testnet.org'] }, public: { http: ['https://baklava-forno.celo-testnet.org'] } },
        blockExplorers: { default: { name: 'CeloScan', url: 'https://baklava.celoscan.io' } },
        testnet: true,
      };
    default:
      return { ...viemChains.hardhat, id: 31337 };
      throw new Error(`Unsupported network: ${networkName}. Please map it in getViemChain.`);
  }
};

// Loads a contract artifact given the direct path to its JSON file.
const loadContractArtifact = (contractName: string, artifactPath: string): ViemContract => {
  console.log("loadContractArtifact", contractName, artifactPath);
  const artifact = readJsonSync(artifactPath) as ForgeArtifact;

  const sourceFiles = Object.keys(artifact.metadata.sources);

  return { abi: artifact.abi as Abi, bytecode: artifact.bytecode.object, address: '0x0' as ViemAddress, sourceFiles: sourceFiles };
};

const findContractArtifactsRecursive = (
  currentPath: string,
  contractArtifactPathsMap: Map<string, string>
) => {
  const entries = readdirSync(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(currentPath, entry.name);
    if (entry.isDirectory()) {
      // Standard Foundry output: out/ContractFile.sol/ContractName.json
      if (entry.name.endsWith('.sol')) {
        const contractJsonFiles = readdirSync(fullPath, { withFileTypes: true });
        for (const file of contractJsonFiles) {
          if (file.isFile() && file.name.endsWith('.json')) {
            const contractName = basename(file.name, '.json');
            try {
              const content = readJsonSync(join(fullPath, file.name));
              if (content.abi && content.bytecode) { // Ensure it's a deployable contract artifact
                contractArtifactPathsMap.set(contractName, join(fullPath, file.name));
              } else if (content.abi) {
                contractArtifactPathsMap.set(contractName, join(fullPath, file.name));
              }
            } catch (e) {
              console.warn(`Skipping non-JSON or unreadable file: ${join(fullPath, file.name)}`);
            }
          }
        }
      } else {
        // Recursively search in other subdirectories
        findContractArtifactsRecursive(fullPath, contractArtifactPathsMap);
      }
    }
  }
};

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['report', 'from', 'proposal', 'librariesFile', 'initialize_data', 'build_directory', 'branch', 'network', 'privateKey', 'mnemonic'],
      default: { network: 'development' },
    });

    const networkName = argv.network;
    const buildDir = argv.build_directory;
    if (!buildDir) throw new Error('--build_directory is required');
    if (!argv.report) throw new Error('--report is required');
    if (!argv.proposal) throw new Error('--proposal is required');
    if (!argv.initialize_data) throw new Error('--initialize_data is required');

    const viemChain = getViemChain(networkName);
    let transportUrl: string;

    if (fornoUrls[networkName] && process.argv.includes('--forno')) {
      transportUrl = fornoUrls[networkName];
    } else if (viemChain.rpcUrls.default?.http?.[0]) {
      transportUrl = viemChain.rpcUrls.default.http[0];
    } else {
      throw new Error(`RPC URL for network ${networkName} could not be determined.`);
    }
    const publicClient = createPublicClient({ chain: viemChain, transport: http(transportUrl) });
    let account: Account;

    if (argv.privateKey) {
      account = privateKeyToAccount(argv.privateKey as Hex);
    } else if (argv.mnemonic) {
      account = mnemonicToAccount(argv.mnemonic as string);
    } else {
      throw new Error('Deployment requires a signer. Please provide --privateKey or --mnemonic.');
    }

    const walletClient = createWalletClient({ account, chain: viemChain, transport: http(transportUrl) });
    const fullReport = readJsonSync(argv.report);
    const libraryMapping: LibraryAddresses['addresses'] = readJsonSync(argv.librariesFile ?? 'libraries.json');
    const report: ASTDetailedVersionedReport = fullReport.report;
    const branch = (argv.branch ? argv.branch : '') as string;
    const initializationData = readJsonSync(argv.initialize_data);
    const dependencies = getCeloContractDependencies();
    const version = getReleaseVersion(branch);

    if (version >= 9) {
      ignoredContractsSet = new Set(ignoredContractsV9);
    }

    const contractArtifactPaths = new Map<string, string>();

    findContractArtifactsRecursive(buildDir, contractArtifactPaths);

    if (contractArtifactPaths.size === 0) {
      console.warn(`No contract artifacts found in ${buildDir}. Ensure the directory is correct and contains Foundry outputs.`);
    }

    const registryArtifactPath = contractArtifactPaths.get('Registry');
    if (!registryArtifactPath) {
      throw new Error(
        `Registry.json artifact not found in ${buildDir} or its subdirectories. ` +
        `Please ensure it is compiled and present in the Foundry output format (e.g., ${buildDir}/Registry.sol/Registry.json).`
      );
    }
    const registryArtifact = loadContractArtifact('Registry', registryArtifactPath);

    const allContractNames = Array.from(contractArtifactPaths.keys())
      .filter(
        (contractName) =>
          !ignoredContractsSet.has(contractName) &&
          !ignoredContractsSet.has(contractName.replace('Proxy', ''))
      );

    const addresses = await ContractAddresses.create(
      allContractNames, // This list is now derived from discovered artifacts
      publicClient,
      registryArtifact.abi,
      celoRegistryAddress as ViemAddress,
      libraryMapping
    );

    const released: Set<string> = new Set([]);
    const proposal: ProposalTx[] = [];

    const release = async (contractNameIn: string) => {
      const contractName = contractNameIn;

      const shouldDeployContract = Object.keys(report.contracts).includes(contractName);
      const shouldDeployLibrary = Object.keys(report.libraries).includes(contractName);

      if (released.has(contractName)) return;
      if (!shouldDeployContract && !shouldDeployLibrary) return;

      const artifactPath = contractArtifactPaths.get(contractName);
      if (!artifactPath) {
        console.error(`Artifact path for ${contractName} not found in map. Skipping.`);
        released.add(contractName);
        return;
      }

      let contractViemArtifact: ViemContract;
      try {
        contractViemArtifact = loadContractArtifact(contractName, artifactPath);
      } catch (e) {
        console.error(`Failed to load artifact for ${contractName} from ${artifactPath}. Skipping. Error: ${e}`);
        released.add(contractName);
        return;
      }

      if (shouldDeployContract) {
        const contractDependencies = dependencies.get(contractName) || [];
        for (const dependency of contractDependencies) {
          if (!released.has(dependency)) await release(dependency);
        }

        if (contractViemArtifact.bytecode && contractViemArtifact.bytecode.includes('__')) {
          for (const dep of contractDependencies) {
            if (addresses.addresses.has(dep)) {
              const libAddress = addresses.get(dep); // Get address without 0x

              let replacedByFoundryPlaceholder = false;
              // console.log("contractArtifactPaths", contractArtifactPaths);

              let libSourceFilePath = contractViemArtifact.sourceFiles.find((file) => file.includes(`${dep}.sol`));

              if (libSourceFilePath) {
                const stringToHash = `${libSourceFilePath}:${dep}`;

                const uint8Array = new TextEncoder().encode(stringToHash);
                const hexStringToHash = toHex(uint8Array);
                const hashed = keccak256(hexStringToHash);
                const placeholderHash = hashed.substring(2, 2 + 34); // Extract 34 chars after 0x

                const placeholderRegexFoundry = new RegExp(`__\\$${placeholderHash}\\$__`, "g");

                if (contractViemArtifact.bytecode!.match(placeholderRegexFoundry)) {
                  // console.log(`Foundry placeholder match for ${dep} in ${contractName} using ${placeholderRegexFoundry}`);
                  contractViemArtifact.bytecode = contractViemArtifact.bytecode!.replace(placeholderRegexFoundry, libAddress) as Hex;
                  replacedByFoundryPlaceholder = true;
                } else {
                  console.log(`Foundry placeholder NO match for ${dep} (${libSourceFilePath}) in ${contractName} using ${placeholderRegexFoundry}. Bytecode sample: ${contractViemArtifact.bytecode!.substring(0, 500)}`);
                }
              } else {
                console.warn(`Could not determine sourceFilePath for library ${dep}. Skipping Foundry placeholder replacement for it in ${contractName}.`);
              }

              // Fallback to old regexes if Foundry placeholder wasn't matched or applicable
              if (!replacedByFoundryPlaceholder) {
                const placeholderRegexSimple = new RegExp(`__${dep}_+`, "g"); // e.g. __Signatures____...
                const placeholderRegexDollar = new RegExp(`__\\$${dep}\\$__`, "g"); // e.g. __$Signatures$__

                if (contractViemArtifact.bytecode!.match(placeholderRegexSimple)) {
                  // console.log(`Legacy placeholder match (simple) for ${dep} in ${contractName}`);
                  contractViemArtifact.bytecode = contractViemArtifact.bytecode!.replace(placeholderRegexSimple, libAddress) as Hex;
                } else if (contractViemArtifact.bytecode!.match(placeholderRegexDollar)) {
                  // console.log(`Legacy placeholder match (dollar) for ${dep} in ${contractName}`);
                  contractViemArtifact.bytecode = contractViemArtifact.bytecode!.replace(placeholderRegexDollar, libAddress) as Hex;
                } else {
                  // console.log(`No placeholder match for ${dep} in ${contractName} with any known pattern.`);
                }
              }
            }
          }
        }
        await deployCoreContract(
          contractName, contractViemArtifact, proposal, addresses, report, initializationData,
          walletClient, publicClient, contractArtifactPaths
        );
      } else if (shouldDeployLibrary) {
        await deployLibrary(
          contractName, contractViemArtifact, addresses, walletClient, publicClient
        );
      }
      released.add(contractName);
    };

    for (const contractName of allContractNames) {
      // Check if the contract is a core contract and if it's proxied
      if (isCoreContract(contractName) && isProxiedContract(contractName)) {
        await release(contractName);
      }
    }

    writeJsonSync(argv.proposal, proposal, { spaces: 2 });
    console.log(`Proposal successfully written to ${argv.proposal}`);
    callback();
  } catch (error) {
    console.error('Error during script execution:', error);
    callback(error);
  }
};

const fornoUrls: { [key: string]: string } = {
  alfajores: 'https://alfajores-forno.celo-testnet.org',
  baklava: 'https://baklava-forno.celo-testnet.org',
  rc1: 'https://forno.celo.org',
  mainnet: 'https://forno.celo.org',
  staging: 'https://staging-forno.celo-networks-dev.org',
};

// --- Self-invocation block ---
if (require.main === module) {
  const mainFunction = module.exports as (callback: (error?: any) => void) => Promise<void>;
  mainFunction((error) => {
    if (error) {
      // The script's internal try/catch (around line 370) already logs the specific error
      process.exit(1);
    } else {
      // The script's internal logic logs success messages (e.g., "Proposal successfully written...")
      process.exit(0);
    }
  }).catch(err => {
    // This catch is for unhandled promise rejections from mainFunction if it doesn't use the callback for errors,
    // or if an error occurs outside the main try/catch block within mainFunction.
    console.error("Unhandled error during script execution:", err);
    process.exit(1);
  });
}
