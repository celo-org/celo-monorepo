import { gasCurrencyWhitelistRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { GasCurrencyWhitelistInstance, RegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return []
}

module.exports = deployProxyAndImplementation<GasCurrencyWhitelistInstance>(
  web3,
  artifacts,
  'GasCurrencyWhitelist',
  initializeArgs,
  async (gasCurrencyWhitelist: GasCurrencyWhitelistInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )

    await registry.setAddressFor(gasCurrencyWhitelistRegistryId, gasCurrencyWhitelist.address)
  }
)
