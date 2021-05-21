import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { RandomInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [config.random.randomnessBlockRetentionWindow]
}

module.exports = deploymentForCoreContract<RandomInstance>(
  web3,
  artifacts,
  CeloContractName.Random,
  initializeArgs
)
