import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { OdisPaymentsInstance } from 'types'

const initializeArgs = async () => {
  return []
}

module.exports = deploymentForCoreContract<OdisPaymentsInstance>(
  web3,
  artifacts,
  CeloContractName.OdisPayments,
  initializeArgs
)
