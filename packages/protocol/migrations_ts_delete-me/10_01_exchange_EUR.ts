import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { FreezerInstance } from 'types'
import { ExchangeEURInstance, ReserveInstance } from 'types/mento'
import { MENTO_PACKAGE } from '../contractPackages'
import { ArtifactsSingleton } from '../lib/artifactsSingleton'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    CeloContractName.StableTokenEUR,
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

    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      ArtifactsSingleton.getInstance(MENTO_PACKAGE)
    )
    // cUSD doesn't need to be added as it is currently harcoded in Reserve.sol
    await reserve.addExchangeSpender(exchange.address)
    await exchange.activateStable()
  },
  MENTO_PACKAGE
)
