/* tslint:disable:no-console */
import Web3 = require('web3')

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ensureLeading0x } from '@celo/utils/lib/address'
import { toFixed } from '@celo/utils/lib/fixidity'
import {
  FeeCurrencyWhitelistInstance,
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
    config.stableToken.initialBalances.addresses,
    config.stableToken.initialBalances.values,
  ]
}

module.exports = deploymentForCoreContract<StableTokenInstance>(
  web3,
  artifacts,
  CeloContractName.StableToken,
  initializeArgs,
  async (stableToken: StableTokenInstance, _web3: Web3, networkName: string) => {
    const minerAddress: string = truffle.networks[networkName].from

    if (config.stableToken.unfreezeImmediately) {
      console.log('Unfreezing StableToken')
      await stableToken.unfreeze()
    }

    console.log('Setting GoldToken/USD exchange rate')
    const sortedOracles: SortedOraclesInstance = await getDeployedProxiedContract<
      SortedOraclesInstance
    >('SortedOracles', artifacts)

    for (const oracle of config.stableToken.oracles) {
      console.info(`Adding ${oracle} as an Oracle for StableToken`)
      await sortedOracles.addOracle(stableToken.address, ensureLeading0x(oracle))
    }

    // We need to seed the exchange rate, and that must be done with an account
    // that's accessible to the migrations. It's in an if statement in case this
    // account happened to be included in config.stableToken.oracles
    if (!(await sortedOracles.isOracle(stableToken.address, minerAddress))) {
      await sortedOracles.addOracle(stableToken.address, minerAddress)
    }
    await sortedOracles.report(
      stableToken.address,
      toFixed(config.stableToken.goldPrice),
      NULL_ADDRESS,
      NULL_ADDRESS
    )

    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    console.info('Adding StableToken to Reserve')
    await reserve.addToken(stableToken.address)

    console.info('Whitelisting StableToken as a fee currency')
    const feeCurrencyWhitelist: FeeCurrencyWhitelistInstance = await getDeployedProxiedContract<
      FeeCurrencyWhitelistInstance
    >('FeeCurrencyWhitelist', artifacts)
    await feeCurrencyWhitelist.addToken(stableToken.address)
  }
)
