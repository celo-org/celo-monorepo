import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForContractWithCustomRegistryId,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { DowntimeSlasherSlotsInstance, LockedGoldInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.downtimeSlasherSlots.penalty,
    config.downtimeSlasherSlots.reward,
    config.downtimeSlasherSlots.slashableDowntime,
    config.downtimeSlasherSlots.slotSize,
    config.downtimeSlasherSlots.oncePerEpoch,
  ]
}

module.exports = deploymentForContractWithCustomRegistryId<DowntimeSlasherSlotsInstance>(
  web3,
  artifacts,
  CeloContractName.DowntimeSlasherSlots,
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
