/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { GasCurrencyWhitelistInstance, GoldTokenInstance } from 'types'

const initializeArgs = async () => {
  return []
}

module.exports = deploymentForCoreContract<GoldTokenInstance>(
  web3,
  artifacts,
  CeloContractName.GoldToken,
  initializeArgs,
  async (goldToken: GoldTokenInstance) => {
    console.info('Whitelisting GoldToken as a gas currency')
    const gasCurrencyWhitelist: GasCurrencyWhitelistInstance = await getDeployedProxiedContract<
      GasCurrencyWhitelistInstance
    >('GasCurrencyWhitelist', artifacts)
    await gasCurrencyWhitelist.addToken(goldToken.address)
  }
)
