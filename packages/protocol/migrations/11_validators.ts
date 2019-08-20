import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deployerForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ValidatorsInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.validators.minElectableValidators,
    config.validators.maxElectableValidators,
    config.validators.minBondedDepositValue,
    config.validators.minBondedDepositNoticePeriod,
  ]
}

module.exports = deployerForCoreContract<ValidatorsInstance>(
  web3,
  artifacts,
  CeloContractName.Validators,
  initializeArgs
)
