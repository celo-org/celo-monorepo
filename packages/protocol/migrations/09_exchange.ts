/* tslint:disable:no-console */

import { exchangeRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
  setInRegistry,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ExchangeInstance, RegistryInstance, ReserveInstance, StableTokenInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
    'StableToken',
    artifacts
  )
  return [
    registry.address,
    stableToken.address,
    config.exchange.spreadNumerator,
    config.exchange.spreadDenominator,
    config.exchange.reserveFractionNumerator,
    config.exchange.reserveFractionDenominator,
    config.exchange.updateFrequency,
    config.exchange.minimumReports,
  ]
}

module.exports = deployProxyAndImplementation<ExchangeInstance>(
  web3,
  artifacts,
  'Exchange',
  initializeArgs,
  async (exchange: ExchangeInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )

    console.log('Setting Exchange as StableToken minter')
    const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
      'StableToken',
      artifacts
    )
    await stableToken.setMinter(exchange.address)

    console.log('Setting Exchange as a Reserve spender')
    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    await reserve.addSpender(exchange.address)

    await setInRegistry(exchange, registry, exchangeRegistryId)
  }
)
