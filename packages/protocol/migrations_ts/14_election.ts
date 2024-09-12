import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { ElectionInstance } from 'types/08'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.election.minElectableValidators,
    config.election.maxElectableValidators,
    config.election.maxVotesPerAccount,
    toFixed(config.election.electabilityThreshold).toFixed(),
  ]
}

module.exports = deploymentForCoreContract<ElectionInstance>(
  web3,
  artifacts,
  CeloContractName.Election,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)
