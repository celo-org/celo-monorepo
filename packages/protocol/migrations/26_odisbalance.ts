import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { OdisBalanceInstance } from 'types'

const initializeArgs = async () => {
  return []
}

module.exports = deploymentForCoreContract<OdisBalanceInstance>(
  web3,
  artifacts,
  CeloContractName.OdisBalance,
  initializeArgs
)
