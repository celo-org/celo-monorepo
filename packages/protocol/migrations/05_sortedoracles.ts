/* tslint:disable:no-console */
import { sortedOraclesRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
  setInRegistry,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { RegistryInstance, SortedOraclesInstance } from 'types'

const initializeArgs = async (): Promise<[number]> => {
  return [config.oracles.reportExpiry]
}

module.exports = deployProxyAndImplementation<SortedOraclesInstance>(
  web3,
  artifacts,
  'SortedOracles',
  initializeArgs,
  async (sortedOracles: SortedOraclesInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )

    await setInRegistry(sortedOracles, registry, sortedOraclesRegistryId)
  }
)
