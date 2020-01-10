import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { DowntimeSlasherInstance, LockedGoldInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.downtimeSlasher.penalty,
    config.downtimeSlasher.reward,
    config.downtimeSlasher.slashableDowntime,
  ]
}

module.exports = deploymentForCoreContract<DowntimeSlasherInstance>(
  web3,
  artifacts,
  CeloContractName.DowntimeSlasher,
  initializeArgs,
  async (slasher: DowntimeSlasherInstance) => {
    const lockedGold: LockedGoldInstance = await getDeployedProxiedContract<LockedGoldInstance>(
      'LockedGold',
      artifacts
    )
    await lockedGold.addSlasher(slasher.address)
  }
)
