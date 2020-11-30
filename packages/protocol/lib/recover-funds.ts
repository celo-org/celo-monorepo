import { _setInitialProxyImplementation } from '@celo/protocol/lib/web3-utils'
import { Address } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { retryTx } from './proxy-utils'

/**
 * 
 * 
 * @param proxyAddress the address of the proxy to recover funds from
 * @param from the address to recover funds to
 */
export async function recoverFunds(proxyAddress: Address, from: Address) {
  const ReleaseGoldMultiSig = artifacts.require('ReleaseGoldMultiSig')
  const ReleaseGoldProxy = artifacts.require('ReleaseGoldProxy')

  const releaseGoldProxy = await ReleaseGoldProxy.at(proxyAddress)
  const balance = await web3.eth.getBalance(releaseGoldProxy.address)
  const recoveredAmount = new BigNumber(balance).minus(new BigNumber(0.001)).dp(0)
  console.info('  Attempting to recover', recoveredAmount, 'CELO')
  const recoveryMultiSig = await retryTx(ReleaseGoldMultiSig.new, [{ from }])
  console.info('  Assigning 1/1 multisig implementation to ReleaseGold Proxy')
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
  console.info('  Transferring funds to', from)
  await retryTx(proxiedMultisig.submitTransaction, [
    from,
    recoveredAmount,
    [],
    {
      from,
    },
  ])
}