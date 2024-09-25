import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { EpochManagerEnablerInstance } from 'types/08'

const initializeArgs = async (): Promise<any[]> => {
  return [config.registry.predeployedProxyAddress]
}

module.exports = deploymentForCoreContract<EpochManagerEnablerInstance>(
  web3,
  artifacts,
  CeloContractName.EpochManagerEnabler,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)
