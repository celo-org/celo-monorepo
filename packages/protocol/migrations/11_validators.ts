import { validatorsRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { RegistryInstance, ValidatorsInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [
    registry.address,
    config.validators.minElectableValidators,
    config.validators.maxElectableValidators,
    config.validators.minBondedDepositValue,
    config.validators.minBondedDepositNoticePeriod,
  ]
}

module.exports = deployProxyAndImplementation<ValidatorsInstance>(
  web3,
  artifacts,
  'Validators',
  initializeArgs,
  async (validators: ValidatorsInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )
    await registry.setAddressFor(validatorsRegistryId, validators.address)
  }
)
