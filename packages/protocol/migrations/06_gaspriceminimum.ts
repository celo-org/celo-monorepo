/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { GasPriceMinimumInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.gasPriceMinimum.initialMinimum,
    toFixed(config.gasPriceMinimum.targetDensity).toString(),
    toFixed(config.gasPriceMinimum.adjustmentSpeed).toString(),
    toFixed(config.gasPriceMinimum.proposerFraction).toString(),
  ]
}

module.exports = deploymentForCoreContract<GasPriceMinimumInstance>(
  web3,
  artifacts,
  CeloContractName.GasPriceMinimum,
  initializeArgs
)
