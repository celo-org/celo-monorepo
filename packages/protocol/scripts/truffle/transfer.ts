import {
  convertToContractDecimalsBN,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { BigNumber } from 'bignumber.js'
import { GoldTokenInstance, StableTokenInstance } from 'types'

/*
 * A simple script to transfer token balances on a testnet.
 *
 * Expects the following flags:
 * network: name of the network defined in truffle-config.js to deploy to
 * to: address of the account to transfer tokens to
 * stableValue: amount of stable token to transfer
 * goldValue: amount of gold transfer
 *
 * Run using truffle exec, e.g.:
 * truffle exec stability/scripts/transfer.js --network testnet --to 0xdead \
 * --stableValue 100 --goldValue 10
 *
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['to'],
    })

    BigNumber.config({ EXPONENTIAL_AT: 500 })
    const goldToken = await getDeployedProxiedContract<GoldTokenInstance>('GoldToken', artifacts)
    const stableToken = await getDeployedProxiedContract<StableTokenInstance>(
      'StableToken',
      artifacts
    )
    const goldAmount = await convertToContractDecimalsBN(argv.goldValue, goldToken)
    const stableAmount = await convertToContractDecimalsBN(argv.stableValue, stableToken)
    await goldToken.transfer(argv.to, goldAmount.toString())
    await stableToken.transfer(argv.to, stableAmount.toString())
    callback()
  } catch (error) {
    callback(error)
  }
}
