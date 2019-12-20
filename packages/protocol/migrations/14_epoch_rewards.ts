import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { EpochRewardsInstance } from 'types'
const truffle = require('@celo/protocol/truffle-config.js')

const initializeArgs = async (networkName: string): Promise<any[]> => {
  const network: any = truffle.networks[networkName]
  return [
    config.registry.predeployedProxyAddress,
    network.from,
    toFixed(config.epochRewards.targetVotingYieldParameters.initial).toFixed(),
    toFixed(config.epochRewards.targetVotingYieldParameters.max).toFixed(),
    toFixed(config.epochRewards.targetVotingYieldParameters.adjustmentFactor).toFixed(),
    toFixed(config.epochRewards.rewardsMultiplierParameters.max).toFixed(),
    toFixed(config.epochRewards.rewardsMultiplierParameters.adjustmentFactors.underspend).toFixed(),
    toFixed(config.epochRewards.rewardsMultiplierParameters.adjustmentFactors.overspend).toFixed(),
    toFixed(config.epochRewards.targetVotingGoldFraction).toFixed(),
    config.epochRewards.maxValidatorEpochPayment,
    toFixed(config.epochRewards.communityRewardFraction).toFixed(),
  ]
}

module.exports = deploymentForCoreContract<EpochRewardsInstance>(
  web3,
  artifacts,
  CeloContractName.EpochRewards,
  initializeArgs
)
