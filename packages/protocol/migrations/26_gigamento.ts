import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { GigaMentoInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [config.registry.predeployedProxyAddress]
}

module.exports = deploymentForCoreContract<GigaMentoInstance>(
  web3,
  artifacts,
  CeloContractName.GigaMento,
  initializeArgs
)
