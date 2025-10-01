import { verifyBytecodes } from '@celo/protocol/lib/compatibility/verify-bytecode'
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

const buildDir = argv.build_artifacts ? argv.build_artifacts : './out'
const branch = (argv.branch ? argv.branch : '') as string
const network = argv.network ?? 'development'
const proposal = argv.proposal ? readJsonSync(argv.proposal) : []
const initializationData = argv.initialize_data ? readJsonSync(argv.initialize_data) : {}
const librariesFile = argv.librariesFile ?? 'libraries.json'

if (!existsSync(buildDir)) {
  throw new Error(`${buildDir} directory not found. Make sure to run foundry build first`)
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
const registryAbi = readJsonSync('./out/Registry.sol/Registry.json')['abi']
const proxyAbi = readJsonSync('./out/Proxy.sol/Proxy.json')['abi']

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
const [buildArtifacts, artifacts08] = instantiateArtifactsFromForge(buildDir)
verifyBytecodes(
  Object.keys(CeloContractName),
  [buildArtifacts, artifacts08],
  registryLookup,
  proposal,
  proxyLookup,
  chainLookup,
  initializationData,
  version,
  network
)
  .then((libraryAddresses) => {
    // eslint-disable-next-line: no-console
    console.info('Success, no bytecode mismatches found!')

    // eslint-disable-next-line: no-console
    console.info(`Writing linked library addresses to ${librariesFile}`)
    writeJsonSync(librariesFile, libraryAddresses.addresses, { spaces: 2 })
  })
  .catch((error) => {
    console.log('Script errored!', error)
  })
