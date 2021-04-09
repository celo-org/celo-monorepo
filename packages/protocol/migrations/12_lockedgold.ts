import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { LockedGoldInstance } from 'types'

module.exports = deploymentForCoreContract<LockedGoldInstance>(
  web3,
  artifacts,
  CeloContractName.LockedGold,
  async () => [config.registry.predeployedProxyAddress, config.lockedGold.unlockingPeriod]
)
