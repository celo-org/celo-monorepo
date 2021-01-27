/* tslint:disable:no-console */

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { ExchangeEURInstance, FreezerInstance, ReserveInstance, StableTokenInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
    'StableToken',
    artifacts
  )
  return [
    // TODO replace this with specific
    config.registry.predeployedProxyAddress,
    stableToken.address,
    toFixed(config.exchange.spread).toString(),
    toFixed(config.exchange.reserveFraction).toString(),
    config.exchange.updateFrequency,
    config.exchange.minimumReports,
  ]
}

module.exports = deploymentForCoreContract<ExchangeEURInstance>(
  web3,
  artifacts,
  CeloContractName.ExchangeEUR,
  initializeArgs,
  async (exchange: ExchangeEURInstance) => {
    if (config.exchange.frozen) {
      const freezer: FreezerInstance = await getDeployedProxiedContract<FreezerInstance>(
        'Freezer',
        artifacts
      )
      await freezer.freeze(exchange.address)
    }
    // const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    //   'Registry',
    //   artifacts
    // )

    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    // cUSD doesn't need to be added as it currently harcoded on reserve.sol
    await reserve.addExchangeSpender(exchange.address)
  }
)
