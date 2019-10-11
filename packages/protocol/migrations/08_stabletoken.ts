/* tslint:disable:no-console */
import Web3 = require('web3')

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  convertToContractDecimalsBN,
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import {
  GasCurrencyWhitelistInstance,
  ReserveInstance,
  SortedOraclesInstance,
  StableTokenInstance,
} from 'types'

const truffle = require('@celo/protocol/truffle-config.js')
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const initializeArgs = async (): Promise<any[]> => {
  const rate = toFixed(config.stableToken.inflationRate)

  return [
    config.stableToken.tokenName,
    config.stableToken.tokenSymbol,
    config.stableToken.decimals,
    config.registry.predeployedProxyAddress,
    rate.toString(),
    config.stableToken.inflationPeriod,
  ]
}

module.exports = deploymentForCoreContract<StableTokenInstance>(
  web3,
  artifacts,
  CeloContractName.StableToken,
  initializeArgs,
  async (stableToken: StableTokenInstance, _web3: Web3, networkName: string) => {
    const minerAddress: string = truffle.networks[networkName].from
    const minerStartBalance = await convertToContractDecimalsBN(
      config.stableToken.minerDollarBalance.toString(),
      stableToken
    )
    console.log(
      `Minting ${minerAddress} ${config.stableToken.minerDollarBalance.toString()} StableToken`
    )
    await stableToken.setMinter(minerAddress)

    const initialBalance = web3.utils.toBN(minerStartBalance)
    await stableToken.mint(minerAddress, initialBalance)
    for (const address of config.stableToken.initialAccounts) {
      await stableToken.mint(address, initialBalance)
    }

    console.log('Setting GoldToken/USD exchange rate')
    const sortedOracles: SortedOraclesInstance = await getDeployedProxiedContract<
      SortedOraclesInstance
    >('SortedOracles', artifacts)

    await sortedOracles.addOracle(stableToken.address, minerAddress)
    await sortedOracles.report(
      stableToken.address,
      config.stableToken.goldPrice,
      1,
      NULL_ADDRESS,
      NULL_ADDRESS
    )

    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    console.log('Adding StableToken to Reserve')
    await reserve.addToken(stableToken.address)

    console.log('Whitelisting StableToken as a gas currency')
    const gasCurrencyWhitelist: GasCurrencyWhitelistInstance = await getDeployedProxiedContract<
      GasCurrencyWhitelistInstance
    >('GasCurrencyWhitelist', artifacts)
    await gasCurrencyWhitelist.addToken(stableToken.address)
  }
)
