import { lockedGoldRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { LockedGoldInstance, RegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [registry.address, config.lockedGold.maxNoticePeriod]
}

module.exports = deployProxyAndImplementation<LockedGoldInstance>(
  web3,
  artifacts,
  'LockedGold',
  initializeArgs,
  async (lockedGold: LockedGoldInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )
    await registry.setAddressFor(lockedGoldRegistryId, lockedGold.address)
  }
)
