/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { FreezerInstance, CeloTokenInstance } from 'types'

const initializeArgs = async () => {
  return [config.registry.predeployedProxyAddress]
}

module.exports = deploymentForCoreContract<CeloTokenInstance>(
  web3,
  artifacts,
  CeloContractName.CeloToken,
  initializeArgs,
  async (celoToken: CeloTokenInstance) => {
    if (config.celoToken.frozen) {
      const freezer: FreezerInstance = await getDeployedProxiedContract<FreezerInstance>(
        'Freezer',
        artifacts
      )
      await freezer.freeze(celoToken.address)
    }
  }
)
