/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { FeeCurrencyWhitelistInstance, GoldTokenInstance } from 'types'

const initializeArgs = async () => {
  return [config.registry.predeployedProxyAddress]
}

module.exports = deploymentForCoreContract<GoldTokenInstance>(
  web3,
  artifacts,
  CeloContractName.GoldToken,
  initializeArgs,
  async (goldToken: GoldTokenInstance) => {
    console.info('Whitelisting GoldToken as a fee currency')
    const feeCurrencyWhitelist: FeeCurrencyWhitelistInstance = await getDeployedProxiedContract<
      FeeCurrencyWhitelistInstance
    >('FeeCurrencyWhitelist', artifacts)
    await feeCurrencyWhitelist.addToken(goldToken.address)
  }
)
