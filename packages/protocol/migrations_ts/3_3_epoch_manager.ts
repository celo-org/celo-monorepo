import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract, getProxiedContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { EpochManagerInstance } from 'types/08'

const initializeArgs = async (): Promise<any[]> => {
  const epochManagerInitializer = await getProxiedContract(
    CeloContractName.EpochManagerEnabler,
    SOLIDITY_08_PACKAGE
  )

  return [
    config.registry.predeployedProxyAddress,
    config.epochManager.newEpochDuration,
    config.epochManager.carbonOffsettingPartner,
    epochManagerInitializer.address
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
