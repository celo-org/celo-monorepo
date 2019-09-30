/* tslint:disable:no-console */

import {
  assertContractsOwnedByMultiSig,
  assertContractsRegistered,
  assertProxiesSet,
  assertRegistryAddressesSet,
  assertStableTokenMinter,
  getReserveBalance,
  proxiedContracts,
} from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import { assert } from 'chai'
import { ProxyInstance } from 'types'

interface ContractBundle {
  contract: Truffle.ContractInstance
  proxy: ProxyInstance
  proxiedContract: Truffle.ContractInstance
}

const contractMapping: any = {}

/*
 * A simple script to check contract state invariants.
 *
 * Expects the following flags:
 * network: name of the network defined in truffle-config.js to test
 * build_directory: location of the appropriate build artifacts
 *
 * Run using truffle exec, e.g.:
 * yarn run truffle exec ./scripts/truffle/network_check.js \
 *  --network integration --build_directory $PWD/build/integration
 *
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    await populateContractMapping()

    await assertProxiesSet(getContract)
    await assertContractsRegistered(getContract)
    await assertRegistryAddressesSet(getContract)
    await assertContractsOwnedByMultiSig(getContract)
    await assertStableTokenMinter(getContract)
    await assertReserveBalance()
    console.log('Network check succeeded!')
    callback()
  } catch (error) {
    callback(error)
  }
}

const populateContractMapping = async () => {
  for (const contractName of proxiedContracts) {
    const Contract: Truffle.Contract<any> = artifacts.require(contractName)
    const contract: Truffle.ContractInstance = await Contract.deployed()
    const proxy: ProxyInstance = await artifacts.require(contractName + 'Proxy').deployed()
    const proxiedContract: Truffle.ContractInstance = await Contract.at(proxy.address)
    const bundle: ContractBundle = { contract, proxy, proxiedContract }

    contractMapping[contractName] = bundle
  }
}

const assertReserveBalance = async () => {
  const balance: BigNumber = new BigNumber(await getReserveBalance(web3, getContract))
  assert.isAtLeast(balance.toNumber(), 1, 'Reserve balance is insufficient')
}

const getContract = async (contractName: string, type: string) => {
  return contractMapping[contractName][type]
}
