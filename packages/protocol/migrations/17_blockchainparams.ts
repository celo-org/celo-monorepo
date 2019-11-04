import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { BlockchainParametersInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  const version = config.blockchainParameters.minimumClientVersion
  return [version.major, version.minor, version.patch]
}

module.exports = deploymentForCoreContract<BlockchainParametersInstance>(
  web3,
  artifacts,
  CeloContractName.BlockchainParameters,
  initializeArgs
)
