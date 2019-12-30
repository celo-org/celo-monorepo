import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { GovernanceSlasherInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [config.registry.predeployedProxyAddress]
}

module.exports = deploymentForCoreContract<GovernanceSlasherInstance>(
  web3,
  artifacts,
  CeloContractName.GovernanceSlasher,
  initializeArgs
)
