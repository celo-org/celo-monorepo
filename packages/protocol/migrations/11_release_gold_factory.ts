import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { RegistryInstance, ReleaseGoldFactoryInstance } from 'types'

const initializeArgs = async (): Promise<[string]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [registry.address]
}

module.exports = deploymentForCoreContract<ReleaseGoldFactoryInstance>(
  web3,
  artifacts,
  CeloContractName.ReleaseGoldFactory,
  initializeArgs
)
