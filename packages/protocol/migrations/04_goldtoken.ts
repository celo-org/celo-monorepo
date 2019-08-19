/* tslint:disable:no-console */
import { CeloContract } from '@celo/protocol/lib/registry-utils'
import { deployerForCoreContract, getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { GasCurrencyWhitelistInstance, GoldTokenInstance } from 'types'

const initializeArgs = async () => {
  return []
}

module.exports = deployerForCoreContract<GoldTokenInstance>(
  web3,
  artifacts,
  CeloContract.GoldToken,
  initializeArgs,
  async (goldToken: GoldTokenInstance) => {
    console.log('Whitelisting GoldToken as a gas currency')
    const gasCurrencyWhitelist: GasCurrencyWhitelistInstance = await getDeployedProxiedContract<
      GasCurrencyWhitelistInstance
    >('GasCurrencyWhitelist', artifacts)
    await gasCurrencyWhitelist.addToken(goldToken.address)
  }
)
