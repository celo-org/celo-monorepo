#!/usr/bin/env ts-node
/* eslint-disable no-console */

import { verifyBytecodesFoundry } from '@celo/protocol/lib/compatibility/verify-bytecode-foundry'
import { getFoundryBuildArtifacts } from '@celo/protocol/lib/foundry-artifacts'
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { readJsonSync, writeJsonSync } from 'fs-extra'
import Web3 from 'web3'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { getReleaseVersion } from '../../lib/compatibility/ignored-contracts-v9'

/*
 * Foundry-based bytecode verification script.
 *
 * This script verifies that a given set of smart contract bytecodes corresponds
 * to a Celo system deployed to a given network. It uses the Registry contract
 * as its source of truth, potentially modified by an optional contract upgrade
 * proposal description.
 *
 * Key differences from Truffle version:
 * - Uses Foundry artifacts from out-truffle-compat/ directories
 * - Handles Foundry's hashed library placeholders
 * - Compiles using forge with truffle-compat profiles
 * - Runs standalone with ts-node (no Truffle dependency)
 *
 * Expects the following flags:
 *   --build_artifacts: The directory in which smart contract build artifacts
 *   can be found (default: "./out-truffle-compat/")
 *   --proposal: The JSON file containing a Governance proposal that
 *   repoints the Registry to newly deployed Proxies and/or repoints existing
 *   Proxies to new implementation addresses.
 *   --initialize_data: The JSON file containing, for each newly deployed Proxy,
 *   the calldata to its logic contract's `initialize` function.
 *   --network: The network to verify (e.g., "mainnet", "alfajores", "baklava")
 *   --rpc_url: The RPC URL to connect to (required)
 *   --librariesFile: The file to which linked library addresses will be
 *   written (default: "libraries-foundry.json").
 *   --branch: The branch name for determining release version.
 *
 * Run using ts-node:
 * yarn ts-node scripts/foundry/verify-bytecode.ts \
 *   --network alfajores \
 *   --rpc_url https://alfajores-forno.celo-testnet.org \
 *   --build_artifacts out-truffle-compat \
 *   --proposal proposal.json
 */

interface VerifyBytecodeArgs {
  build_artifacts?: string
  proposal?: string
  initialize_data?: string
  network?: string
  rpc_url: string
  librariesFile?: string
  branch?: string
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('build_artifacts', {
      type: 'string',
      description: 'Directory containing build artifacts',
      default: './out-truffle-compat',
    })
    .option('proposal', {
      type: 'string',
      description: 'JSON file containing governance proposal',
    })
    .option('initialize_data', {
      type: 'string',
      description: 'JSON file containing initialization data',
    })
    .option('network', {
      type: 'string',
      description: 'Network to verify',
      default: 'development',
    })
    .option('rpc_url', {
      type: 'string',
      description: 'RPC URL to connect to',
      demandOption: true,
    })
    .option('librariesFile', {
      type: 'string',
      description: 'File to write library addresses to',
      default: 'libraries-foundry.json',
    })
    .option('branch', {
      type: 'string',
      description: 'Branch name for determining release version',
      default: '',
    })
    .argv as VerifyBytecodeArgs

  const artifactsDirectory = argv.build_artifacts!
  const artifacts08Directory = `${argv.build_artifacts}-0.8`
  const branch = argv.branch || ''
  const network = argv.network!
  const proposal = argv.proposal ? readJsonSync(argv.proposal) : []
  const initializationData = argv.initialize_data ? readJsonSync(argv.initialize_data) : {}
  const librariesFile = argv.librariesFile!

  try {
    console.log(`Connecting to network: ${network}`)
    console.log(`RPC URL: ${argv.rpc_url}`)

    // Initialize Web3
    const web3 = new Web3(argv.rpc_url)

    // Load Registry and Proxy ABIs from build artifacts
    const registryArtifactPath = `${artifactsDirectory}/Registry.sol/Registry.json`
    const proxyArtifactPath = `${artifactsDirectory}/Proxy.sol/Proxy.json`

    let registryABI: any[]
    let proxyABI: any[]

    try {
      const registryArtifact = readJsonSync(registryArtifactPath)
      registryABI = registryArtifact.abi
    } catch (error) {
      throw new Error(`Failed to load Registry artifact from ${registryArtifactPath}: ${error}`)
    }

    try {
      const proxyArtifact = readJsonSync(proxyArtifactPath)
      proxyABI = proxyArtifact.abi
    } catch (error) {
      throw new Error(`Failed to load Proxy artifact from ${proxyArtifactPath}: ${error}`)
    }

    const version = getReleaseVersion(branch)

    // Create Registry contract instance
    const registry = new web3.eth.Contract(registryABI, celoRegistryAddress)

    // Load Foundry artifacts from both directories
    console.log(`Loading Foundry artifacts from ${artifactsDirectory}...`)
    const buildArtifacts = getFoundryBuildArtifacts(artifactsDirectory)
    console.log(`Loading Foundry artifacts from ${artifacts08Directory}...`)
    const artifacts08 = getFoundryBuildArtifacts(artifacts08Directory)

    // Show detailed artifact distribution
    console.log(`\n📋 Artifact Set Details:`)
    console.log(`\n${artifactsDirectory}:`)
    const contracts05 = buildArtifacts.getAllContractNames()
    console.log(`  ${contracts05.length} contracts total`)
    if (contracts05.length > 0) {
      console.log(`  First 20: ${contracts05.slice(0, 20).join(', ')}${contracts05.length > 20 ? '...' : ''}`)
    }

    console.log(`\n${artifacts08Directory}:`)
    const contracts08 = artifacts08.getAllContractNames()
    console.log(`  ${contracts08.length} contracts total`)
    if (contracts08.length > 0) {
      console.log(`  First 20: ${contracts08.slice(0, 20).join(', ')}${contracts08.length > 20 ? '...' : ''}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('Starting bytecode verification...')
    console.log('='.repeat(80) + '\n')
    const libraryAddresses = await verifyBytecodesFoundry(
      Object.keys(CeloContractName),
      [buildArtifacts, artifacts08],
      registry as any, // Cast to avoid type mismatch between different web3-eth-contract versions
      proposal,
      proxyABI,
      web3,
      initializationData,
      version,
      network
    )

    console.info('✅ Success, no bytecode mismatches found!')

    // Write library addresses to file (flat format: name -> address)
    console.info(`Writing linked library addresses to ${librariesFile}`)
    writeJsonSync(librariesFile, libraryAddresses.addresses, { spaces: 2 })

    process.exit(0)
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

main()
