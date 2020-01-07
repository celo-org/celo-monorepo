import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { DowntimeSlasherInstance } from 'types'

const initializeArgs = async (_: string): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.downtimeSlasher.penalty,
    config.downtimeSlasher.reward,
    config.downtimeSlasher.slashableDowntime,
  ]
}

module.exports = deploymentForCoreContract<DowntimeSlasherInstance>(
  web3,
  artifacts,
  CeloContractName.DowntimeSlasher,
  initializeArgs
)
