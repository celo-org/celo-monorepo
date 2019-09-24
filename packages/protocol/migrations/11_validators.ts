import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ValidatorsInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.validators.registrationRequirements.group,
    config.validators.registrationRequirements.validator,
    config.validators.deregistrationLockups.group,
    config.validators.deregistrationLockups.validator,
    config.validators.maxGroupSize,
  ]
}

module.exports = deploymentForCoreContract<ValidatorsInstance>(
  web3,
  artifacts,
  CeloContractName.Validators,
  initializeArgs
)
