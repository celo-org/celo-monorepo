import { verifyBytecodes } from '@celo/protocol/lib/compatibility/verify-bytecode'
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { getBuildArtifacts } from '@openzeppelin/upgrades'
import { ProxyInstance, RegistryInstance } from 'types'

import fs = require('fs')

/*
 * This script verifies that a given set of smart contract bytecodes corresponds
 * to a Celo system deployed to a given network. It uses the Registry constract
 * as its source of truth, potentially modified by an optional contract upgrade
 * proposal description.
 *
 * Expects the following flags:
 *   build_artifacts: The directory in which smart contract build artifacts can
 *   be found.
 *   proposal (optional): The JSON file containing a Governance proposal that
 *   repoints the Registry to newly deployed Proxies and/or repoints existing
 *   Proxies to new implementation addresses.
 *   before_release_1 (optional): a temporary feature flag needed before the
 *   first contracts upgrades establishes new conventions around how smart
 *   contracts are handled on chain. Specifically, after the first release,
 *   linked libraries will be proxied, so libraries before this release have to
 *   be handled differently by this script.
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/verify-bytecode \
 *   --network alfajores --build_directory build/alfajores/contracts --proposal proposal.json \
 *   --before_release_1
 */

const Registry: Truffle.Contract<RegistryInstance> = artifacts.require('Registry')
const Proxy: Truffle.Contract<ProxyInstance> = artifacts.require('Proxy')

const argv = require('minimist')(process.argv.slice(2), {
  string: ['build_artifacts', 'proposal'],
  boolean: ['before_release_1, quiet'],
})

const artifactsDirectory = argv.build_artifacts ? argv.build_artifacts : './build/contracts'
const proposal = argv.proposal ? JSON.parse(fs.readFileSync(argv.proposal).toString()) : []
const beforeRelease1 = argv.before_release_1
const quiet = argv.quiet

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
      beforeRelease1,
      quiet
    )
  } catch (error) {
    callback(error)
  }
}
