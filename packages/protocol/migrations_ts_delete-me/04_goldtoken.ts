import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { FreezerInstance, GoldTokenInstance, RegistryInstance } from 'types'

const initializeArgs = async () => {
  return [config.registry.predeployedProxyAddress]
}

module.exports = deploymentForCoreContract<GoldTokenInstance>(
  web3,
  artifacts,
  CeloContractName.GoldToken,
  initializeArgs,
  async (goldToken: GoldTokenInstance) => {
    if (config.goldToken.frozen) {
      const freezer: FreezerInstance = await getDeployedProxiedContract<FreezerInstance>(
        'Freezer',
        artifacts
      )
      await freezer.freeze(goldToken.address)
    }
    const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
    await registry.setAddressFor(CeloContractName.CeloToken, goldToken.address)
  }
)
