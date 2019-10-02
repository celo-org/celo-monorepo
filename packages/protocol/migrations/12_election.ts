import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ElectionInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.election.minElectableValidators,
    config.election.maxElectableValidators,
    config.election.maxVotesPerAccount,
    config.election.electabilityThreshold,
  ]
}

module.exports = deploymentForCoreContract<ElectionInstance>(
  web3,
  artifacts,
  CeloContractName.Election,
  initializeArgs
)
