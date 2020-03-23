import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { EpochRewardsInstance, FreezerInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    toFixed(config.epochRewards.targetVotingYieldParameters.initial).toFixed(),
    toFixed(config.epochRewards.targetVotingYieldParameters.max).toFixed(),
    toFixed(config.epochRewards.targetVotingYieldParameters.adjustmentFactor).toFixed(),
    toFixed(config.epochRewards.rewardsMultiplierParameters.max).toFixed(),
    toFixed(config.epochRewards.rewardsMultiplierParameters.adjustmentFactors.underspend).toFixed(),
    toFixed(config.epochRewards.rewardsMultiplierParameters.adjustmentFactors.overspend).toFixed(),
    toFixed(config.epochRewards.targetVotingGoldFraction).toFixed(),
    config.epochRewards.maxValidatorEpochPayment,
    toFixed(config.epochRewards.communityRewardFraction).toFixed(),
    config.epochRewards.carbonOffsettingPartner,
    toFixed(config.epochRewards.carbonOffsettingFraction).toFixed(),
  ]
}

module.exports = deploymentForCoreContract<EpochRewardsInstance>(
  web3,
  artifacts,
  CeloContractName.EpochRewards,
  initializeArgs,
  async (epochRewards: EpochRewardsInstance) => {
    if (config.epochRewards.frozen) {
      const freezer: FreezerInstance = await getDeployedProxiedContract<FreezerInstance>(
        'Freezer',
        artifacts
      )
      await freezer.freeze(epochRewards.address)
    }
  }
)
