import { ProxyContract, ProxyCloneFactoryContract, ProxyFactoryContract } from 'types'

/*
 * A script for testing gas optimizations for proxy deployments.
 *
 * Expects the following flags:
 * from: address of the account to making the request (should be unlocked for the running fullnode)
 * network: name of the network defined in truffle-config.js to deploy to
 *
 * Run using truffle exec, e.g.:
 * yarn ganache-dev
 * yarn run truffle exec ./scripts/truffle/proxy-gas-costs.js --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --network development
 *
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(4), {
      string: ['from'],
    })
    const Proxy: ProxyContract = artifacts.require('Proxy')
    const ProxyFactory: ProxyFactoryContract = artifacts.require('ProxyFactory')
    const ProxyCloneFactory: ProxyCloneFactoryContract = artifacts.require('ProxyCloneFactory')

    console.info('Deploying ProxyFactory...')
    const proxyFactory = await ProxyFactory.new({ from: argv.from })
    console.info('Deploying ProxyCloneFactory...')
    const proxyCloneFactory = await ProxyCloneFactory.new({ from: argv.from })

    console.info('Deploying Proxy without factory...')
    const proxy = await Proxy.new({ from: argv.from })
    const receipt = await web3.eth.getTransactionReceipt(proxy.transactionHash)
    console.log(`  Deploying a proxy without a factory takes ${parseInt(receipt.gasUsed, 16)} gas`)

    console.info('Deploying Proxy with factory...')
    const proxyFromFactory = await proxyFactory.createProxy({ from: argv.from })
    console.log(`  Deploying a proxy with a factory takes ${proxyFromFactory.receipt.gasUsed} gas`)

    console.info('Deploying Proxy clone with factory...')
    await proxyCloneFactory.setProxyAddress(proxy.address)
    const proxyCloneFromFactory = await proxyCloneFactory.deploy(argv.from, '', '', {
      from: argv.from,
    })
    console.log(
      `  Deploying a proxy clone with a factory takes ${proxyCloneFromFactory.receipt.gasUsed} gas`
    )

    callback()
  } catch (e) {
    console.error('Something went wrong')
    callback(e)
  }
}
