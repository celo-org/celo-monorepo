import { retryTx } from '@celo/protocol/lib/proxy-utils'
import { _setInitialProxyImplementation } from '@celo/protocol/lib/web3-utils'
import { MultiSigContract, ProxyContract } from 'types'

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(4), {
      string: ['from', 'owners', 'required', 'internalRequired'],
    })
    const multSig: MultiSigContract = artifacts.require('MultiSig')
    const Proxy: ProxyContract = artifacts.require('Proxy')

    console.info('  Deploying MultiSigProxy...')
    const proxy = await retryTx(Proxy.new, [{ from: argv.from }])
    console.info('  Deploying MultiSig...')
    const multiSig = await retryTx(multSig.new, [{ from: argv.from }])
    await _setInitialProxyImplementation(
      web3,
      multiSig,
      proxy,
      'MultiSig',
      {
        from: argv.from,
        value: null,
      },
      argv.owners.split(','),
      argv.required,
      argv.internalRequired
    )
    await retryTx(proxy._transferOwnership, [
      proxy.address,
      {
        from: argv.from,
      },
    ])
    console.info('Proxy address', proxy.address)
    console.info('Implementation address', multiSig.address)
    callback()
  } catch (e) {
    console.error('Something went wrong')
    callback(e)
  }
}
