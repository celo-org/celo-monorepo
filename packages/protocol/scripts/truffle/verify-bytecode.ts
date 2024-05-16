import { verifyBytecodes } from '@celo/protocol/lib/compatibility/verify-bytecode'
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { getBuildArtifacts } from '@openzeppelin/upgrades'
import { readJsonSync, writeJsonSync } from 'fs-extra'
import { ProxyInstance, RegistryInstance } from 'types'
import { getReleaseVersion } from '../../lib/compatibility/ignored-contracts-v9'

/*
 * This script verifies that a given set of smart contract bytecodes corresponds
 * to a Celo system deployed to a given network. It uses the Registry contract
 * as its source of truth, potentially modified by an optional contract upgrade
 * proposal description.
 *
 * Expects the following flags:
 *   --build_artifacts: The directory in which smart contract build artifacts
 *   can be found (default: "./build/contracts/")
 *   --proposal: The JSON file containing a Governance proposal that
 *   repoints the Registry to newly deployed Proxies and/or repoints existing
 *   Proxies to new implementation addresses.
 *   --initialize_data: The JSON file containing, for each newly deployed Proxy,
 *   the calldata to its logic contract's `initialize` function.
 *   --network: The name of the network to verify (default: "development").
 *   --librariesFile: The file to which linked library addresses will be
 *   written (default: "libraries.json").
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/verify-bytecode \
 *   --network alfajores --build_artifacts build/alfajores/contracts --proposal proposal.json
 */

const Registry: Truffle.Contract<RegistryInstance> = artifacts.require('Registry')
const Proxy: Truffle.Contract<ProxyInstance> = artifacts.require('Proxy')

const argv = require('minimist')(process.argv.slice(2), {
  string: ['build_artifacts', 'proposal', 'initialize_data', 'network', 'librariesFile', 'branch'],
})

const artifactsDirectory = argv.build_artifacts ? argv.build_artifacts : './build/contracts'
const artifacts08Directory = argv.build_artifacts08
  ? argv.build_artifacts08
  : './build/contracts-0.8'
const branch = (argv.branch ? argv.branch : '') as string
const network = argv.network ?? 'development'
const proposal = argv.proposal ? readJsonSync(argv.proposal) : []
const initializationData = argv.initialize_data ? readJsonSync(argv.initialize_data) : {}
const librariesFile = argv.librariesFile ?? 'libraries.json'

module.exports = async (callback: (error?: any) => number) => {
  try {
    const version = getReleaseVersion(branch)

    const registry = await Registry.at(celoRegistryAddress)
    const buildArtifacts = getBuildArtifacts(artifactsDirectory)
    const artifacts08 = getBuildArtifacts(artifacts08Directory)
    const libraryAddresses = await verifyBytecodes(
      Object.keys(CeloContractName),
      [buildArtifacts, artifacts08],
      registry,
      proposal,
      Proxy,
      web3,
      initializationData,
      version,
      network
    )

    // eslint-disable-next-line: no-console
    console.info('Success, no bytecode mismatches found!')

    // eslint-disable-next-line: no-console
    console.info(`Writing linked library addresses to ${librariesFile}`)
    writeJsonSync(librariesFile, libraryAddresses.addresses, { spaces: 2 })
  } catch (error) {
    callback(error)
  }
}
