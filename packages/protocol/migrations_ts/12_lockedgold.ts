import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { LockedGoldInstance, RegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return []
}

module.exports = deploymentForCoreContract<LockedGoldInstance>(
  web3,
  artifacts,
  CeloContractName.LockedGold,
  initializeArgs,
  async (lockedGold: LockedGoldInstance) => {
    const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
    await registry.setAddressFor(CeloContractName.LockedCelo, lockedGold.address)
    return [config.registry.predeployedProxyAddress, config.lockedGold.unlockingPeriod]
  }
)
