/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { GasPriceMinimumInstance, RegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [
    registry.address,
    config.gasPriceMinimum.initialMinimum,
    config.gasPriceMinimum.targetDensity.numerator,
    config.gasPriceMinimum.targetDensity.denominator,
    config.gasPriceMinimum.adjustmentSpeed.numerator,
    config.gasPriceMinimum.adjustmentSpeed.denominator,
    config.gasPriceMinimum.infrastructureFraction.numerator,
    config.gasPriceMinimum.infrastructureFraction.denominator,
  ]
}

module.exports = deploymentForCoreContract<GasPriceMinimumInstance>(
  web3,
  artifacts,
  CeloContractName.GasPriceMinimum,
  initializeArgs
)
