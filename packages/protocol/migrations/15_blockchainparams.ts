import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { BlockchainParamsInstance } from 'types'
import { config } from '@celo/protocol/migrationsConfig'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [config.blockchainParams.minimumClientVersion]
}

module.exports = deploymentForCoreContract<BlockchainParamsInstance>(
  web3,
  artifacts,
  CeloContractName.BlockchainParams,
  initializeArgs
)
