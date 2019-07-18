/* tslint:disable:no-console */
import { goldTokenRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
  setInRegistry,
} from '@celo/protocol/lib/web3-utils'
import { GasCurrencyWhitelistInstance, GoldTokenInstance, RegistryInstance } from 'types'

const initializeArgs = async () => {
  return []
}

module.exports = deployProxyAndImplementation<GoldTokenInstance>(
  web3,
  artifacts,
  'GoldToken',
  initializeArgs,
  async (goldToken: GoldTokenInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )

    await setInRegistry(goldToken, registry, goldTokenRegistryId)

    console.log('Whitelisting GoldToken as a gas currency')
    const gasCurrencyWhitelist: GasCurrencyWhitelistInstance = await getDeployedProxiedContract<
      GasCurrencyWhitelistInstance
    >('GasCurrencyWhitelist', artifacts)
    await gasCurrencyWhitelist.addToken(goldToken.address)
  }
)
