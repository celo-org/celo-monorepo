import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { DoubleSigningSlasherInstance, LockedGoldInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.doubleSigningSlasher.penalty,
    config.doubleSigningSlasher.reward,
  ]
}

module.exports = deploymentForCoreContract<DoubleSigningSlasherInstance>(
  web3,
  artifacts,
  CeloContractName.DoubleSigningSlasher,
  initializeArgs,
  async (slasher: DoubleSigningSlasherInstance) => {
    const lockedGold: LockedGoldInstance = await getDeployedProxiedContract<LockedGoldInstance>(
      'LockedGold',
      artifacts
    )
    await lockedGold.addSlasher(slasher.address)
  }
)
