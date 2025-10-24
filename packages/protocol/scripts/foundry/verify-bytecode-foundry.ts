import { verifyBytecodes } from '@celo/protocol/lib/compatibility/verify-bytecode-foundry'
import { getReleaseVersion } from '../../lib/compatibility/ignored-contracts-v9'

import { CeloContractName } from '@celo/protocol/lib/registry-utils'

import { existsSync, readJsonSync, writeJsonSync } from 'fs-extra'
import { Chain, createPublicClient, encodeFunctionData, http } from 'viem'
import * as viemChains from 'viem/chains'
import { instantiateArtifactsFromForge } from '@celo/protocol/lib/compatibility/utils'

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
  string: ['build_artifacts', 'proposal', 'initialize_data', 'network', 'librariesFile', 'branch'],
})

const branch = (argv.branch ? argv.branch : '') as string
const buildDir05 = `./out-${branch}-truffle-compat`
const buildDir08 = `./out-${branch}-truffle-compat8`
const network = argv.network ?? 'development'
const proposal = argv.proposal ? readJsonSync(argv.proposal) : []
const initializationData = argv.initialize_data ? readJsonSync(argv.initialize_data) : {}
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
    case 'alfajores':
      return viemChains.celoAlfajores
    case 'celo':
    case 'mainnet':
    case 'rc1':
      return viemChains.celo
    case 'celo-sepolia':
      return {
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
      }
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
const viemChain = getViemChain(network)
const transportUrl = viemChain.rpcUrls.default.http[0]
const publicClient = createPublicClient({
  chain: viemChain,
  transport: http(transportUrl),
})

const version = getReleaseVersion(branch)

const registryAddress = '0x000000000000000000000000000000000000ce10'
const registryAbi = readJsonSync(`${buildDir05}/Registry.sol/Registry.json`)['abi']
const proxyAbi = readJsonSync(`${buildDir05}/Proxy.sol/Proxy.json`)['abi']

const getAddressForString = (contract: string) => {
  return publicClient.readContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: 'getAddressForString',
    args: [contract],
  })
}

const getImplementation = (address: string) => {
  return publicClient.readContract({
    address: address,
    abi: proxyAbi,
    functionName: '_getImplementation',
    args: [],
  })
}

const registryLookup = { getAddressForString }
const proxyLookup = { getImplementation }
const chainLookup = {
  getCode: (address: `0x${string}`) => {
    return publicClient.getCode({ address })
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
  network
)
  .then((libraryLinkingInfo) => {
    // eslint-disable-next-line: no-console
    console.info('Success, no bytecode mismatches found!')

    // eslint-disable-next-line: no-console
    console.info(`Writing linked library addresses to ${librariesFile}`)
    writeJsonSync(librariesFile, libraryLinkingInfo.getAddressMapping(), { spaces: 2 })
  })
  .catch((error) => {
    console.log('Script errored!', error)
  })
