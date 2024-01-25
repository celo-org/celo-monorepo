import assert = require('assert')

import {
  getDeployedProxiedContract,
  submitMultiSigTransaction,
} from '@celo/protocol/lib/web3-utils'
import { MultiSigInstance } from 'types'

/*
 * A simple script to process transactions via a MultiSig
 *
 * Expects the following flags:
 * command: the command to run
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/govern.js --command 'stableToken.setMinter(0xdeadbeef)'
 *
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['command'],
    })

    const multiSig = await getDeployedProxiedContract<MultiSigInstance>('MultiSig', artifacts)

    // TODO(asa): Validate function arguments
    assert(RegExp('^[A-z]+.[A-z]+(.*)$').test(argv.command))

    let contract
    const [contractName, functionCall] = argv.command.split('.')
    if (contractName.includes('Proxy')) {
      const Proxy: Truffle.Contract<any> = artifacts.require(contractName)
      contract = await Proxy.deployed()
    } else {
      contract = await getDeployedProxiedContract(contractName, artifacts)
    }

    const functionName = functionCall.split('(')[0]
    const functionArgs = functionCall.split('(')[1].split(')')[0].split(', ')

    console.info(contractName, contract.address, functionName, functionArgs)
    console.info('Calling', '"' + argv.command + '"', 'via MultiSig')
    await submitMultiSigTransaction(
      multiSig,
      contract.address,
      // @ts-ignore There is a property 'contract' on the variable contract
      contract.contract[functionName].getData(...functionArgs)
    )
    callback()
  } catch (error) {
    callback(error)
  }
}
