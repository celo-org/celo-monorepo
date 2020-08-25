import { getBuildArtifacts } from '@openzeppelin/upgrades'

import { ProxyInstance, RegistryInstance } from 'types'

import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { verifyBytecodesDfs } from '@celo/protocol/lib/compatibility/verify-bytecode'

const Registry: Truffle.Contract<RegistryInstance> = artifacts.require('Registry')
const Proxy: Truffle.Contract<ProxyInstance> = artifacts.require('Proxy')

module.exports = async (callback: (error?: any) => number) => {
  try {
    const registry = await Registry.at(celoRegistryAddress)
    const buildArtifacts = getBuildArtifacts('./build/contracts')
    await verifyBytecodesDfs(Object.keys(CeloContractName), buildArtifacts, registry, Proxy, web3)
  } catch (error) {
    callback(error)
  }
}
