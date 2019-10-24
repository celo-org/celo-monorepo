import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { EpochRewardsInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    toFixed(config.epochRewards.targetVotingYieldParameters.initial).toFixed(),
    toFixed(config.epochRewards.targetVotingYieldParameters.max).toFixed(),
    toFixed(config.epochRewards.targetVotingYieldParameters.adjustmentFactor).toFixed(),
    toFixed(config.epochRewards.rewardsMultiplierAdjustmentFactors.underspend).toFixed(),
    toFixed(config.epochRewards.rewardsMultiplierAdjustmentFactors.overspend).toFixed(),
    config.epochRewards.maxValidatorEpochPayment,
  ]
}

module.exports = deploymentForCoreContract<EpochRewardsInstance>(
  web3,
  artifacts,
  CeloContractName.EpochRewards,
  initializeArgs
)
