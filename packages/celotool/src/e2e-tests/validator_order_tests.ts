import { ContractKit, newKit } from '@celo/contractkit'
import { assert } from 'chai'
import _ from 'lodash'
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

const VALIDATORS = 5
const EPOCH = 10
const EPOCHS_TO_WAIT = 5
const BLOCK_COUNT = EPOCH * EPOCHS_TO_WAIT
const VALIDATOR_BLOCKS = BLOCK_COUNT / VALIDATORS
const BLOCK_COUNT_ARRAY = Array.from(Array(BLOCK_COUNT).keys())
const VALIDATOR_BLOCK_COUNT_ARRAY = Array(VALIDATORS).fill(VALIDATOR_BLOCKS)

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

  describe('Validator ordering', () => {
    before(async function() {
      this.timeout(0)
      await restart()
    })

    it('properly orders validators randomly', async function(this: any) {
      this.timeout(100000)

      const latestBlockNumber = (await contractKit.web3.eth.getBlock('latest')).number
      const epochRemainder = latestBlockNumber % EPOCH
      const nextEpoch = latestBlockNumber + (epochRemainder === 0 ? 0 : EPOCH - epochRemainder) + 1

      // wait for enough blocks
      while ((await contractKit.web3.eth.getBlock('latest')).number < nextEpoch + BLOCK_COUNT) {
        await sleep(2)
      }

      // fetch the validator for each block
      const blocks = await Promise.all(
        BLOCK_COUNT_ARRAY.map(async (num) => contractKit.web3.eth.getBlock(num + nextEpoch))
      )
      const validators = blocks.map((block) => block.miner)

      // ensure each validator has an equal number of blocks
      const validatorCounts = _.countBy(validators)
      assert.deepEqual(Object.values(validatorCounts), VALIDATOR_BLOCK_COUNT_ARRAY)

      let firstOrdering
      let uniqueOrdering = false
      for (let i = 0; i < EPOCHS_TO_WAIT; i++) {
        const epochBlocks = validators.slice(i * EPOCH, (i + 1) * EPOCH)
        const ordering = epochBlocks.slice(0, EPOCH / VALIDATORS)
        if (i === 0) {
          firstOrdering = ordering
        }

        // ensure within an epoch, ordering is consistent
        ordering.forEach((validator, index) => {
          assert.equal(validator, epochBlocks[VALIDATORS + index])
        })

        // ensure there is a unique ordering in different epochs
        if (i !== 0) {
          if (!_.isEqual(firstOrdering, ordering)) {
            uniqueOrdering = true
          }
        }
      }

      // ensure unique orderings for epochs
      assert.equal(uniqueOrdering, true)
    })
  })
})
