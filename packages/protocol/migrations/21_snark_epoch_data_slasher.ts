import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { LockedGoldInstance, SnarkEpochDataSlasherInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.snarkEpochDataSlasher.penalty,
    config.snarkEpochDataSlasher.reward,
  ]
}

module.exports = deploymentForCoreContract<SnarkEpochDataSlasherInstance>(
  web3,
  artifacts,
  CeloContractName.SnarkEpochDataSlasher,
  initializeArgs,
  async () => {
    console.info('Adding SnarkEpochDataSlasher contract as slasher.')
    const lockedGold: LockedGoldInstance = await getDeployedProxiedContract<LockedGoldInstance>(
      'LockedGold',
      artifacts
    )
    try {
      await lockedGold.addSlasher(CeloContractName.SnarkEpochDataSlasher)
    } catch (err) {
      console.info('hmm', err)
    }
  }
)
