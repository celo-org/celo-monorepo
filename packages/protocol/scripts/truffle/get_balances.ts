import { getDeployedProxiedContract, getERC20TokenBalance } from '@celo/protocol/lib/web3-utils'
import { GoldTokenInstance, StableTokenInstance } from 'types'

/*
 * A simple script to check token balances on a testnet.
 *
 * Expects the following flags:
 * network: name of the network defined in truffle-config.js to deploy to
 * account: address of the account to transfer tokens to
 *
 * Run using truffle exec, e.g.:
 * truffle exec stability/scripts/get_balances.js --network testnet --account 0xdead
 *
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['account'],
    })

    const goldToken = await getDeployedProxiedContract<GoldTokenInstance>('GoldToken', artifacts)
    const stableToken = await getDeployedProxiedContract<StableTokenInstance>(
      'StableToken',
      artifacts
    )

    // tslint:disable
    console.log('StableToken balance:', await getERC20TokenBalance(argv.account, stableToken))
    console.log('GoldToken balance:', await getERC20TokenBalance(argv.account, goldToken))
    // tslint:enable
    callback()
  } catch (error) {
    callback(error)
  }
}
