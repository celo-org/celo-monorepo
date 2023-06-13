import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { BlockchainParametersInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [
    config.blockchainParameters.gasForNonGoldCurrencies,
    config.blockchainParameters.deploymentBlockGasLimit,
    config.blockchainParameters.uptimeLookbackWindow,
  ]
}

module.exports = deploymentForCoreContract<BlockchainParametersInstance>(
  web3,
  artifacts,
  CeloContractName.BlockchainParameters,
  initializeArgs
)
