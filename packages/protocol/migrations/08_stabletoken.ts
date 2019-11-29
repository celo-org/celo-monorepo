/* tslint:disable:no-console */
import Web3 = require('web3')

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
  sendTransactionWithPrivateKey,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { privateKeyToAddress } from '@celo/utils/lib/address'
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
  async (stableToken: StableTokenInstance, web3: Web3, networkName: string) => {
    const sortedOracles: SortedOraclesInstance = await getDeployedProxiedContract<
      SortedOraclesInstance
    >('SortedOracles', artifacts)

    console.info('Adding inital C Labs oracles to the SortedOracles whitelist')
    const oracleAddresses = config.stableToken.oracleKeys.map(privateKeyToAddress)
    for (const oracle of oracleAddresses) {
      console.info(`Adding ${oracle} as an Oracle for StableToken`)
      await sortedOracles.addOracle(stableToken.address, oracle)
    }

    // If there were no oracles set, we still need to set the initial exchange rate.
    // Default to using the first validator
    if (oracleAddresses.length === 0) {
      console.info('No oracle keys were found in the config. Using the first validator instead')

      const minerAddress: string = truffle.networks[networkName].from
      console.info(`Adding ${minerAddress} as an Oracle for StableToken`)
      await sortedOracles.addOracle(stableToken.address, minerAddress)

      console.info(
        'Setting the initial GoldToken/USD exchange rate, reporting as the first validator'
      )
      await sortedOracles.report(
        stableToken.address,
        config.stableToken.goldPrice,
        1,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
    } else {
      console.info(
        `Setting the initial GoldToken/USD exchange rate, reporting as the first oracle: ${
          oracleAddresses[0]
        }`
      )

      // @ts-ignore
      const reportTx = sortedOracles.contract.methods.report(
        stableToken.address,
        config.stableToken.goldPrice,
        1,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
      await sendTransactionWithPrivateKey(web3, reportTx, config.stableToken.oracleKeys[0], {
        to: sortedOracles.address,
      })
    }

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
