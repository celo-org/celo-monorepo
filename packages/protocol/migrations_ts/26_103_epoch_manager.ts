import { config } from '@celo/protocol/migrationsConfig'
import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { SortedOraclesInstance } from 'types'
import { EpochManagerInstance } from 'types/08'

const initializeArgs = async (): Promise<any[]> => {
  const sortedOracles: SortedOraclesInstance =
    await getDeployedProxiedContract<SortedOraclesInstance>(
      CeloContractName.SortedOracles,
      artifacts
    )
  return [
    config.registry.predeployedProxyAddress,
    config.epochManager.newEpochDuration,
    sortedOracles.address,
  ]
}

module.exports = deploymentForCoreContract<EpochManagerInstance>(
  web3,
  artifacts,
  CeloContractName.EpochManager,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)
