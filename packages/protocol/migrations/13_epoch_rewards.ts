import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { EpochRewardsInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.epochRewards.maxValidatorEpochPayment,
    toFixed(config.epochRewards.maxTargetVotingYield).toFixed(),
    toFixed(config.epochRewards.initialTargetVotingYield).toFixed(),
  ]
}

module.exports = deploymentForCoreContract<EpochRewardsInstance>(
  web3,
  artifacts,
  CeloContractName.EpochRewards,
  initializeArgs
)
