import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForContractWithCustomRegistryId,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { DowntimeSlasherIntervalsInstance, LockedGoldInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.DowntimeSlasherIntervals.penalty,
    config.DowntimeSlasherIntervals.reward,
    config.DowntimeSlasherIntervals.slashableDowntime,
  ]
}

module.exports = deploymentForContractWithCustomRegistryId<DowntimeSlasherIntervalsInstance>(
  web3,
  artifacts,
  CeloContractName.DowntimeSlasherIntervals,
  CeloContractName.DowntimeSlasher,
  initializeArgs,
  async () => {
    console.info('Adding DowntimeSlasher contract as slasher.')
    const lockedGold: LockedGoldInstance = await getDeployedProxiedContract<LockedGoldInstance>(
      'LockedGold',
      artifacts
    )
    await lockedGold.addSlasher(CeloContractName.DowntimeSlasher)
  }
)
