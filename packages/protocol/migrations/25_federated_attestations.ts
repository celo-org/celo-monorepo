import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { FederatedAttestationsInstance } from 'types'

const initializeArgs = async (): Promise<[string]> => {
  return [config.registry.predeployedProxyAddress]
}

module.exports = deploymentForCoreContract<FederatedAttestationsInstance>(
  web3,
  artifacts,
  CeloContractName.FederatedAttestations,
  initializeArgs
)
