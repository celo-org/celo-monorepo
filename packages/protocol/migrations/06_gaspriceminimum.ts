/* tslint:disable:no-console */
import { gasPriceMinimumRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
  setInRegistry,
} from '@celo/protocol/lib/web3-utils'
import { toFixed } from '@celo/protocol/lib/fixidity'
import { config } from '@celo/protocol/migrationsConfig'
import { GasPriceMinimumInstance, RegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  // @ts-ignore
  registry.numberFormat = 'BigNumber'
  return [
    registry.address,
    config.gasPriceMinimum.initialMinimum,
    toFixed(config.gasPriceMinimum.targetDensity).toString(),
    toFixed(config.gasPriceMinimum.adjustmentSpeed).toString(),
    toFixed(config.gasPriceMinimum.infrastructureFraction).toString(),
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
