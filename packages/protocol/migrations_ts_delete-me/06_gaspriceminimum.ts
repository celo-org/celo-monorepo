import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { GasPriceMinimumInstance } from 'types/08'
import { SOLIDITY_08_PACKAGE } from '../contractPackages'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.gasPriceMinimum.minimumFloor,
    toFixed(config.gasPriceMinimum.targetDensity).toString(),
    toFixed(config.gasPriceMinimum.adjustmentSpeed).toString(),
    config.gasPriceMinimum.baseFeeOpCodeActivationBlock,
  ]
}

module.exports = deploymentForCoreContract<GasPriceMinimumInstance>(
  web3,
  artifacts,
  CeloContractName.GasPriceMinimum,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)
