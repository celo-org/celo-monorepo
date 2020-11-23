import { _setInitialProxyImplementation } from '@celo/protocol/lib/web3-utils'
import { Address } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { retryTx } from '../../lib/proxy-utils'

async function recoverFunds(proxyAddress: Address, from: Address) {
  const ReleaseGoldMultiSig = artifacts.require('ReleaseGoldMultiSig')
  const ReleaseGoldProxy = artifacts.require('ReleaseGoldProxy')

  const releaseGoldProxy = await ReleaseGoldProxy.at(proxyAddress)
  const balance = await web3.eth.getBalance(releaseGoldProxy.address)

  const recoveryMultiSig = await retryTx(ReleaseGoldMultiSig.new, [{ from }])
  await _setInitialProxyImplementation(
    web3,
    recoveryMultiSig,
    releaseGoldProxy,
    'ReleaseGoldMultiSig',
    {
      from,
      value: null,
    },
    [from],
    1,
    1
  )

  const proxiedMultisig = await ReleaseGoldMultiSig.at(proxyAddress)
  await retryTx(proxiedMultisig.submitTransaction, [
    from,
    new BigNumber(balance).minus(new BigNumber(0.001)).dp(0),
    [],
    {
      from,
    },
  ])
}

module.exports = async (callback: (error?: any) => number) => {
  const argv = require('minimist')(process.argv.slice(5), {
    string: ['release_gold', 'from'],
  })

  await recoverFunds(argv.release_gold, argv.from)
  callback()
}
