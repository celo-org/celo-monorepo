import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { MintGoldScheduleInstance } from 'types'

const initializeArgs = async () => {
  return [
    config.mintGoldSchedule.l2StartTime,
    toFixed(config.mintGoldSchedule.communityRewardFraction).toFixed(),
    config.mintGoldSchedule.carbonOffsettingPartner,
    toFixed(config.mintGoldSchedule.carbonOffsettingFraction).toFixed(),
    config.registry.predeployedProxyAddress,
  ]
}

module.exports = deploymentForCoreContract<MintGoldScheduleInstance>(
  web3,
  artifacts,
  CeloContractName.MintGoldSchedule,
  initializeArgs
)
