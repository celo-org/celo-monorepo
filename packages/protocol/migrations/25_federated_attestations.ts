import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { FederatedAttestationsInstance } from 'types'

const initializeArgs = async () => {
  return []
}

module.exports = deploymentForCoreContract<FederatedAttestationsInstance>(
  web3,
  artifacts,
  CeloContractName.FederatedAttestations,
  initializeArgs
)
