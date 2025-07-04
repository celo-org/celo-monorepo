import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { EpochManagerInstance } from 'types/08'

const initializeArgs = async (): Promise<any[]> => {
  return [config.registry.predeployedProxyAddress, config.epochManager.newEpochDuration]
}

module.exports = deploymentForCoreContract<EpochManagerInstance>(
  web3,
  artifacts,
  CeloContractName.EpochManager,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)
