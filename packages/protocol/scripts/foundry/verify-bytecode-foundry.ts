import {
  InitializationData,
  verifyBytecodes,
} from '@celo/protocol/lib/compatibility/verify-bytecode-foundry'
import { getReleaseVersion } from '../../lib/compatibility/ignored-contracts-v9'

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { ProposalTx } from '@celo/protocol/scripts/truffle/make-release'

import { instantiateArtifactsFromForge } from '@celo/protocol/lib/compatibility/utils'
import { existsSync, readJsonSync, writeJsonSync } from 'fs-extra'
import { Chain, createPublicClient, defineChain, encodeFunctionData, http } from 'viem'
import * as viemChains from 'viem/chains'

/*
 * This script verifies that a given set of smart contract bytecodes corresponds
 * to a Celo system deployed to a given network. It uses the Registry contract
 * as its source of truth, potentially modified by an optional contract upgrade
 * proposal description.
 *
 * Expects the following flags:
 *   --out: The directory in which smart contract build artifacts
 *   can be found (default: "./build/contracts/")
 *   --proposal: The JSON file containing a Governance proposal that
 *   repoints the Registry to newly deployed Proxies and/or repoints existing
 *   Proxies to new implementation addresses.
 *   --initialize_data: The JSON file containing, for each newly deployed Proxy,
 *   the calldata to its logic contract's `initialize` function.
 *   --network: The name of the network to verify (default: "development").
 *   --librariesFile: The file to which linked library addresses will be
 *   written (default: "libraries.json").
 */

const argv = require('minimist')(process.argv.slice(2), {
  string: [
    'build_artifacts',
    'proposal',
    'initialize_data',
    'network',
    'librariesFile',
    'branch',
    'extraTxs',
  ],
  boolean: ['allowError'],
})

const branch = (argv.branch ? argv.branch : '') as string
const buildDir05 = `./out-${branch}-truffle-compat`
const buildDir08 = `./out-${branch}-truffle-compat8`
const network: string = argv.network ?? 'development'
const proposal: ProposalTx[] = argv.proposal ? readJsonSync(argv.proposal) : []
const initializationData: InitializationData = argv.initialize_data
  ? readJsonSync(argv.initialize_data)
  : {}
if (argv.extraTxs && !argv.proposal) {
  console.warn('--extraTxs ignored because no --proposal was provided')
}
const extraTxs: ProposalTx[] = argv.extraTxs && argv.proposal ? readJsonSync(argv.extraTxs) : []
const allowError: boolean = argv.allowError ?? false
const librariesFile = argv.librariesFile ?? 'libraries.json'

if (!existsSync(buildDir05)) {
  throw new Error(`${buildDir05} directory not found. Make sure to run foundry build first`)
}

if (!existsSync(buildDir08)) {
  throw new Error(`${buildDir08} directory not found. Make sure to run foundry build first`)
}

// TODO deduplicate with make-release
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
const viemChain = getViemChain(network)
const transportUrl = viemChain.rpcUrls.default.http[0]
const publicClient = createPublicClient({
  chain: viemChain,
  transport: http(transportUrl),
})

const version = getReleaseVersion(branch)

const registryAddress = '0x000000000000000000000000000000000000ce10'
const registryAbi = readJsonSync(`${buildDir05}/Registry.sol/Registry.json`).abi
const proxyAbi = readJsonSync(`${buildDir05}/Proxy.sol/Proxy.json`).abi

const getAddressForString = async (contract: string): Promise<string> => {
  const result = await publicClient.readContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: 'getAddressForString',
    args: [contract],
  })
  return result as string
}

const getImplementation = async (address: string): Promise<string> => {
  const result = await publicClient.readContract({
    address: address as `0x${string}`,
    abi: proxyAbi,
    functionName: '_getImplementation',
    args: [],
  })
  return result as string
}

const registryLookup = { getAddressForString }
const proxyLookup = { getImplementation }
const chainLookup = {
  getCode: (address: `0x${string}`) => {
    return publicClient.getBytecode({ address })
  },
  encodeFunctionCall: (abi: any, args: any[]) => {
    return encodeFunctionData({
      abi: [abi],
      functionName: abi.name,
      args,
    })
  },
  getProof: (address: `0x${string}`, slots: `0x${string}`[]) => {
    return publicClient.getProof({
      address,
      storageKeys: slots,
    })
  },
}

const [artifacts05] = instantiateArtifactsFromForge(buildDir05)
const [artifacts08] = instantiateArtifactsFromForge(buildDir08)
verifyBytecodes(
  Object.keys(CeloContractName),
  [artifacts05, artifacts08],
  registryLookup,
  proposal,
  proxyLookup,
  chainLookup,
  initializationData,
  version,
  network,
  extraTxs,
  allowError
)
  .then(({ libraryLinkingInfo, verifiedLibraries, hasErrors }) => {
    const allMapping = libraryLinkingInfo.getAddressMapping()
    const verifiedMapping = {}
    for (const library of verifiedLibraries) {
      verifiedMapping[library] = allMapping[library]
    }

    /* eslint-disable no-console */
    if (hasErrors) {
      const errFile = librariesFile.replace(/\.json$/, '-err.json')
      console.info(`Writing linked library addresses to ${errFile}`)
      writeJsonSync(errFile, verifiedMapping, { spaces: 2 })
      process.exit(1)
    } else {
      console.log(`\n✅ All contracts and libraries verified successfully!`)
      console.info(`Writing linked library addresses to ${librariesFile}`)
      writeJsonSync(librariesFile, verifiedMapping, { spaces: 2 })
    }
  })
  .catch((error) => {
    console.info('Script errored!', error)
    process.exit(1)
  })
