import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
  transferOwnershipOfProxyAndImplementation,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { DowntimeSlasherSlotsInstance, GovernanceInstance, LockedGoldInstance } from 'types'

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

module.exports = deploymentForCoreContract<DowntimeSlasherSlotsInstance>(
  web3,
  artifacts,
  CeloContractName.DowntimeSlasherSlots,
  initializeArgs,
  async () => {
    console.info('Adding DowntimeSlasherSlots contract as slasher.')
    const lockedGold: LockedGoldInstance = await getDeployedProxiedContract<LockedGoldInstance>(
      'LockedGold',
      artifacts
    )
    await lockedGold.addSlasher(CeloContractName.DowntimeSlasherSlots)
  }
)

// TODO CHECK THIS GET governance address
const transferOwnership = async () => {
  const governance: GovernanceInstance = await getDeployedProxiedContract<GovernanceInstance>(
    'Governance',
    artifacts
  )

  if (!config.governance.skipTransferOwnership) {
    await transferOwnershipOfProxyAndImplementation(
      'DowtimeSlasherSlots',
      governance.address,
      artifacts
    )
  }
}

// tslint:disable-next-line: no-floating-promises
transferOwnership()
