import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { MentoFeeHandlerSellerInstance } from 'types'

const initializeArgs = async () => {
  return [config.registry.predeployedProxyAddress, [], []]
}

module.exports = deploymentForCoreContract<MentoFeeHandlerSellerInstance>(
  web3,
  artifacts,
  CeloContractName.MentoFeeHandlerSeller,
  initializeArgs
)
