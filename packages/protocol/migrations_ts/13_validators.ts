import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ValidatorsInstance } from 'types/08'
import { SOLIDITY_08_PACKAGE } from '../contractPackages'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.validators.groupLockedGoldRequirements.value,
    config.validators.groupLockedGoldRequirements.duration,
    config.validators.validatorLockedGoldRequirements.value,
    config.validators.validatorLockedGoldRequirements.duration,
    config.validators.membershipHistoryLength,
    config.validators.slashingPenaltyResetPeriod,
    config.validators.maxGroupSize,
    {
      commissionUpdateDelay: config.validators.commissionUpdateDelay,
      downtimeGracePeriod: config.validators.downtimeGracePeriod,
    },
  ]
}

module.exports = deploymentForCoreContract<ValidatorsInstance>(
  web3,
  artifacts,
  CeloContractName.Validators,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)
