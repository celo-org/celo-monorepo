import { ContractKit, newKit } from '@celo/contractkit'
import { assert } from 'chai'
import { getContext, GethTestConfig, sleep } from './utils'

const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
// @ts-ignore
const validatorAddresses = [
  '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  '0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B',
  '0xA42c9b0d1A30722AEa8b81E72957134897E7A11a',
  '0x848920B14154b6508B8d98e7eE8159AA84b579A4',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
]

const EPOCH = 10

const VALIDATOR_ORDER = [
  '0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B',
  '0x848920B14154b6508B8d98e7eE8159AA84b579A4',
  '0xA42c9b0d1A30722AEa8b81E72957134897E7A11a',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
  '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  '0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B',
  '0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
  '0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B',
  '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  '0xA42c9b0d1A30722AEa8b81E72957134897E7A11a',
  '0xA42c9b0d1A30722AEa8b81E72957134897E7A11a',
  '0xA42c9b0d1A30722AEa8b81E72957134897E7A11a',
  '0x848920B14154b6508B8d98e7eE8159AA84b579A4',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
  '0x848920B14154b6508B8d98e7eE8159AA84b579A4',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
  '0xA42c9b0d1A30722AEa8b81E72957134897E7A11a',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
  '0x848920B14154b6508B8d98e7eE8159AA84b579A4',
  '0x848920B14154b6508B8d98e7eE8159AA84b579A4',
  '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
  '0x848920B14154b6508B8d98e7eE8159AA84b579A4',
  '0x848920B14154b6508B8d98e7eE8159AA84b579A4',
  '0x2ffe970257D93eae9d6B134f528b93b262C31030',
]

describe('governance tests', () => {
  const gethConfig: GethTestConfig = {
    migrateTo: 13,
    instances: [
      { name: 'validator0', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
      { name: 'validator1', validating: true, syncmode: 'full', port: 30305, rpcport: 8547 },
      { name: 'validator2', validating: true, syncmode: 'full', port: 30307, rpcport: 8549 },
      { name: 'validator3', validating: true, syncmode: 'full', port: 30309, rpcport: 8551 },
      { name: 'validator4', validating: true, syncmode: 'full', port: 30311, rpcport: 8553 },
    ],
  }

  const context: any = getContext(gethConfig)
  let contractKit: ContractKit

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(context.hooks.after)

  const restart = async () => {
    await context.hooks.restart()
    contractKit = newKit('http://localhost:8545')
    contractKit.defaultAccount = validatorAddress

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
  }

  describe('Validators', () => {
    before(async function() {
      this.timeout(0)
      await restart()
    })

    it('requests an attestation', async function(this: any) {
      this.timeout(100000)

      const latestBlockNumber = (await contractKit.web3.eth.getBlock('latest')).number
      console.log('Latest block: ', latestBlockNumber)
      const epochRemainder = latestBlockNumber % EPOCH
      console.log('Epoch remainder: ', epochRemainder)
      const nextEpoch = latestBlockNumber + (epochRemainder === 0 ? 0 : EPOCH - epochRemainder)
      console.log('Next epoch: ', nextEpoch)

      while ((await contractKit.web3.eth.getBlock('latest')).number < nextEpoch + 30) {
        await sleep(2)
        console.log('waiting for 30 blocks')
      }

      const blocks = await Promise.all(
        Array.from(Array(30).keys()).map(async (num) =>
          contractKit.web3.eth.getBlock(num + nextEpoch)
        )
      )
      const validators = blocks.map((block) => block.miner)
      const print = blocks.map((block) => ({ validator: block.miner, number: block.number }))

      console.log(validators)
      console.log(print)
      assert.deepEqual(validators, VALIDATOR_ORDER)
    })
  })
})
