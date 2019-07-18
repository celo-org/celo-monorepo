/* tslint:disable:no-console */
import Web3 = require('web3')

import {
  convertToContractDecimalsBN,
  deployProxyAndImplementation,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import {
  GasCurrencyWhitelistInstance,
  RegistryInstance,
  ReserveInstance,
  SortedOraclesInstance,
  StableTokenInstance,
} from 'types'

const truffle = require('@celo/protocol/truffle.js')
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const initializeArgs = async (): Promise<any[]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )

  return [
    config.stableToken.tokenName,
    config.stableToken.tokenSymbol,
    config.stableToken.decimals,
    registry.address,
    config.stableToken.inflationRateNumerator,
    config.stableToken.inflationRateDenominator,
    config.stableToken.inflationPeriod,
  ]
}

module.exports = deployProxyAndImplementation<StableTokenInstance>(
  web3,
  artifacts,
  'StableToken',
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
    await stableToken.mint(minerAddress, web3.utils.toBN(minerStartBalance))

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
