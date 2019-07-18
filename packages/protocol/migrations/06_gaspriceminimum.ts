/* tslint:disable:no-console */
import { gasPriceMinimumRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
  setInRegistry,
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

module.exports = deployProxyAndImplementation<GasPriceMinimumInstance>(
  web3,
  artifacts,
  'GasPriceMinimum',
  initializeArgs,
  async (gasPriceMinimum: GasPriceMinimumInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )
    await setInRegistry(gasPriceMinimum, registry, gasPriceMinimumRegistryId)
  }
)
