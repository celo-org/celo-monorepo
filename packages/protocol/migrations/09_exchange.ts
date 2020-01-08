/* tslint:disable:no-console */

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { ExchangeInstance, ReserveInstance, StableTokenInstance } from 'types'
const truffle = require('@celo/protocol/truffle-config.js')

const initializeArgs = async (networkName: string): Promise<any[]> => {
  const network: any = truffle.networks[networkName]
  const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
    'StableToken',
    artifacts
  )
  return [
    config.registry.predeployedProxyAddress,
    network.from,
    stableToken.address,
    toFixed(config.exchange.spread).toString(),
    toFixed(config.exchange.reserveFraction).toString(),
    config.exchange.updateFrequency,
    config.exchange.minimumReports,
  ]
}

module.exports = deploymentForCoreContract<ExchangeInstance>(
  web3,
  artifacts,
  CeloContractName.Exchange,
  initializeArgs,
  async (exchange: ExchangeInstance) => {
    console.log('Setting Exchange as a Reserve spender')
    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    await reserve.addSpender(exchange.address)
    if (config.epochRewards.frozen) {
      await exchange.freeze()
    }
  }
)
