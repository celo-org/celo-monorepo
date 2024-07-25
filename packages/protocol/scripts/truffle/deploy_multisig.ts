import { _setInitialProxyImplementation, retryTx } from '@celo/protocol/lib/web3-utils'
import { ProxyContract } from 'types'
import { MultiSigContract } from 'types/08'

/*
 * A simple script to deploy a multisig contract.
 *
 * Expects the following flags:
 * from: address of the account to making the request (should be unlocked for the running fullnode)
 * owners: comma delimited list of multisig owners
 * required: number of required owners needed to execute a call
 * internalRequired: number of required owners needed to make internal changes to the multisig (eg. adding/removing owners)
 * network: name of the network defined in truffle-config.js to deploy to
 *
 * Run using truffle exec, e.g.:
 * yarn run truffle exec ./scripts/truffle/deploy_multisig.js --from 0xdead --owners 0xdead,0xf00d,0xd8a3 --required 2 --internalRequired 2 --network rc1
 *
 */
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
