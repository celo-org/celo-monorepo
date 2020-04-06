/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { ElectionInstance, FreezerInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.election.minElectableValidators,
    config.election.maxElectableValidators,
    config.election.maxVotesPerAccount,
    toFixed(config.election.electabilityThreshold).toFixed(),
  ]
}

module.exports = deploymentForCoreContract<ElectionInstance>(
  web3,
  artifacts,
  CeloContractName.Election,
  initializeArgs,
  async (election: ElectionInstance) => {
    if (config.election.frozen) {
      console.log(`\tFreezing validator elections`)
      const freezer: FreezerInstance = await getDeployedProxiedContract<FreezerInstance>(
        'Freezer',
        artifacts
      )
      await freezer.freeze(election.address)
    }
  }
)
