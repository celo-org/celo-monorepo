import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { UniswapFeeHandlerSellerInstance } from 'types'

const initializeArgs = async () => {
  return []
}

module.exports = deploymentForCoreContract<UniswapFeeHandlerSellerInstance>(
  web3,
  artifacts,
  CeloContractName.UniswapFeeHandlerSeller,
  initializeArgs
)
