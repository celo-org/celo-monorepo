import { getBuildArtifacts } from '@openzeppelin/upgrades'

import { ProxyInstance, RegistryInstance } from 'types'

import { verifyBytecodesDfs } from '@celo/protocol/lib/compatibility/verify-bytecode'
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'

import fs = require('fs')

const Registry: Truffle.Contract<RegistryInstance> = artifacts.require('Registry')
const Proxy: Truffle.Contract<ProxyInstance> = artifacts.require('Proxy')

const argv = require('minimist')(process.argv.slice(2), {
  string: ['build_artifacts', 'proposal'],
  boolean: ['before_release_1'],
})

const artifactsDirectory = argv.build_artifacts ? argv.build_artifacts : './build/contracts'
const proposal = argv.proposal ? JSON.parse(fs.readFileSync(argv.proposal).toString()) : []
const beforeRelease1 = argv.before_release_1

module.exports = async (callback: (error?: any) => number) => {
  try {
    const registry = await Registry.at(celoRegistryAddress)
    const buildArtifacts = getBuildArtifacts(artifactsDirectory)
    await verifyBytecodesDfs(
      Object.keys(CeloContractName),
      buildArtifacts,
      registry,
      proposal,
      Proxy,
      web3,
      beforeRelease1
    )
  } catch (error) {
    callback(error)
  }
}
