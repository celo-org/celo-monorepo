import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { ValidatorsInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.validators.groupLockedGoldRequirements.value,
    config.validators.groupLockedGoldRequirements.duration,
    config.validators.validatorLockedGoldRequirements.value,
    config.validators.validatorLockedGoldRequirements.duration,
    config.validators.validatorScoreParameters.exponent,
    toFixed(config.validators.validatorScoreParameters.adjustmentSpeed).toFixed(),
    config.validators.membershipHistoryLength,
    config.validators.slashingPenaltyResetPeriod,
    config.validators.maxGroupSize,
    config.validators.commissionUpdateDelay,
  ]
}

module.exports = deploymentForCoreContract<ValidatorsInstance>(
  web3,
  artifacts,
  CeloContractName.Validators,
  initializeArgs
)
