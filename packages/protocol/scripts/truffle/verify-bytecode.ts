import { verifyBytecodes } from '@celo/protocol/lib/compatibility/verify-bytecode'
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { getBuildArtifacts } from '@openzeppelin/upgrades'
import { readJsonSync } from 'fs-extra'
import { ProxyInstance, RegistryInstance } from 'types'

/*
 * This script verifies that a given set of smart contract bytecodes corresponds
 * to a Celo system deployed to a given network. It uses the Registry constract
 * as its source of truth, potentially modified by an optional contract upgrade
 * proposal description.
 *
 * Expects the following flags:
 *   --build_directory: The directory in which smart contract build artifacts
 *   can be found (defaults to ./build/contracts/)
 *   --proposal: The JSON file containing a Governance proposal that
 *   repoints the Registry to newly deployed Proxies and/or repoints existing
 *   Proxies to new implementation addresses.
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/verify-bytecode \
 *   --network alfajores --build_directory build/alfajores/contracts --proposal proposal.json
 */

const Registry: Truffle.Contract<RegistryInstance> = artifacts.require('Registry')
const Proxy: Truffle.Contract<ProxyInstance> = artifacts.require('Proxy')

const argv = require('minimist')(process.argv.slice(2), {
  string: ['build_artifacts', 'proposal', 'initialize_data'],
  boolean: ['before_release_1'],
})

const artifactsDirectory = argv.build_artifacts ? argv.build_artifacts : './build/contracts'
const proposal = argv.proposal ? readJsonSync(argv.proposal) : []
const initializationData = argv.initialize_data ? readJsonSync(argv.initialize_data) : {}

module.exports = async (callback: (error?: any) => number) => {
  try {
    const registry = await Registry.at(celoRegistryAddress)
    const buildArtifacts = getBuildArtifacts(artifactsDirectory)
    await verifyBytecodes(
      Object.keys(CeloContractName),
      buildArtifacts,
      registry,
      proposal,
      Proxy,
      web3,
      initializationData
    )

    // tslint:disable-next-line: no-console
    console.log('Success, no bytecode mismatches found!')
  } catch (error) {
    callback(error)
  }
}
