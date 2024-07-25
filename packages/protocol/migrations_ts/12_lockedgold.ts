import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { IRegistryInstance, LockedGoldInstance } from 'types/08'

const initializeArgs = async (): Promise<any[]> => {
  return [config.registry.predeployedProxyAddress, config.lockedGold.unlockingPeriod]
}

module.exports = deploymentForCoreContract<LockedGoldInstance>(
  web3,
  artifacts,
  CeloContractName.LockedGold,
  initializeArgs,
  async (lockedGold: LockedGoldInstance) => {
    const registry = await getDeployedProxiedContract<IRegistryInstance>('Registry', artifacts)
    await registry.setAddressFor(CeloContractName.LockedCelo, lockedGold.address)
  }
)
