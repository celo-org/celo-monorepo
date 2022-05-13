/* tslint:disable:no-console */

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import {
  ExchangeBRLInstance,
  FreezerInstance,
  ReserveInstance,
  StableTokenBRLInstance,
} from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const stableTokenBRL: StableTokenBRLInstance = await getDeployedProxiedContract<StableTokenBRLInstance>(
    'StableTokenBRL',
    artifacts
  )
  return [
    config.registry.predeployedProxyAddress,
    stableTokenBRL.address,
    toFixed(config.exchange.spread).toString(),
    toFixed(config.exchange.reserveFraction).toString(),
    config.exchange.updateFrequency,
    config.exchange.minimumReports,
  ]
}

module.exports = deploymentForCoreContract<ExchangeBRLInstance>(
  web3,
  artifacts,
  CeloContractName.ExchangeBRL,
  initializeArgs,
  async (exchange: ExchangeBRLInstance) => {
    if (config.exchange.frozen) {
      const freezer: FreezerInstance = await getDeployedProxiedContract<FreezerInstance>(
        'Freezer',
        artifacts
      )
      await freezer.freeze(exchange.address)
    }

    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    // cUSD doesn't need to be added as it is currently harcoded in Reserve.sol
    await reserve.addExchangeSpender(exchange.address)
  }
)
