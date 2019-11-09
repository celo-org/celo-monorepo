// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3.d.ts" />

import { ContractKit, newKit } from '@celo/contractkit'
import { BlockchainParametersWrapper } from '@celo/contractkit/lib/wrappers/BlockchainParameters'
import { assert } from 'chai'
import { getHooks, GethTestConfig, sleep } from './utils'

describe('Blockchain parameters tests', function(this: any) {
  this.timeout(0)

  let kit: ContractKit
  let parameters: BlockchainParametersWrapper

  const gethConfig: GethTestConfig = {
    migrateTo: 17,
    instances: [
      { name: 'validator', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
    ],
  }
  const hooks = getHooks(gethConfig)
  before(hooks.before)
  after(hooks.after)

  const validatorAddress: string = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'

  const restartGeth = async () => {
    // Restart the validator node
    await hooks.restart()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    kit = newKit('http://localhost:8545')
    await kit.web3.eth.personal.unlockAccount(validatorAddress, '', 1000)
    parameters = await kit.contracts.getBlockchainParameters()
  }

  const setMinimumClientVersion = async (major: number, minor: number, patch: number) => {
    await parameters.setMinimumClientVersion(major, minor, patch).send({ from: validatorAddress })
  }

  describe('when running a node', () => {
    before(async () => {
      await restartGeth()
    })
    it('block limit should have been set using governance', async () => {
      this.timeout(0)
      const current = await kit.web3.eth.getBlockNumber()
      const block = await kit.web3.eth.getBlock(current)
      assert.equal(block.gasLimit, 20000000)
    })
    it('changing the block gas limit', async () => {
      this.timeout(0)
      await parameters.setBlockGasLimit(23000000).send({ from: validatorAddress })
      await sleep(5)
      const current = await kit.web3.eth.getBlockNumber()
      const block = await kit.web3.eth.getBlock(current)
      assert.equal(block.gasLimit, 23000000)
    })
    it('should exit when minimum version is updated', async () => {
      this.timeout(0)
      await setMinimumClientVersion(1, 8, 99)
      await sleep(120)
      try {
        // It should have exited by now, call RPC to trigger error
        await kit.web3.eth.getBlockNumber()
      } catch (_) {
        return
      }
      throw new Error('expected failure')
    })
  })
})
