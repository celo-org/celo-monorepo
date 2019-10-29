import { ContractKit, newKit } from '@celo/contractkit'
import { assert } from 'chai'
import _ from 'lodash'
import { getContext, GethTestConfig, sleep } from './utils'

const VALIDATORS = 10
const EPOCH = 20
const EPOCHS_TO_WAIT = 3
const BLOCK_COUNT = EPOCH * EPOCHS_TO_WAIT

describe('governance tests', () => {
  const gethConfig: GethTestConfig = {
    migrateTo: 13,
    instances: _.range(VALIDATORS).map((i) => ({
      name: `validator${i}`,
      validating: true,
      syncmode: 'full',
      port: 30303 + 2 * i,
      rpcport: 8545 + 2 * i,
    })),
    genesisConfig: {
      epoch: EPOCH,
    },
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
    contractKit.defaultAccount = context.validators[0].address

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
  }

  describe('Validator ordering', () => {
    before(async function() {
      this.timeout(0)
      await restart()
    })

    it('properly orders validators randomly', async function(this: any) {
      this.timeout(160000)

      const latestBlockNumber = (await contractKit.web3.eth.getBlock('latest')).number
      const indexInEpoch = ((latestBlockNumber % EPOCH) + EPOCH - 1) % EPOCH
      const nextEpoch = latestBlockNumber + (EPOCH - indexInEpoch)

      // Wait for enough blocks.
      while ((await contractKit.web3.eth.getBlock('latest')).number < nextEpoch + BLOCK_COUNT) {
        await sleep(2)
      }

      // Fetch the validator for each block.
      const blocks = await Promise.all(
        _.range(BLOCK_COUNT).map(async (i) => contractKit.web3.eth.getBlock(i + nextEpoch))
      )
      const validators = blocks.map((block) => block.miner)

      // Ensure each validator has an equal number of blocks.
      const expectedCount = BLOCK_COUNT / VALIDATORS
      for (const [validator, count] of Object.entries(_.countBy(validators))) {
        assert.equal(count, expectedCount, `${validator} should have mined ${expectedCount} blocks`)
      }

      const orderings: string[][] = []
      for (let i = 0; i < EPOCHS_TO_WAIT; i++) {
        const epochValidators = validators.slice(i * EPOCH, (i + 1) * EPOCH)
        const ordering = epochValidators.slice(0, VALIDATORS)

        // Ensure within an epoch, ordering is consistent.
        for (const [index, validator] of ordering.entries()) {
          assert.equal(validator, epochValidators[VALIDATORS + index])
        }

        // Ensure each epoch has a unique ordering.
        // Note: This has a 1/(VALIDATORS!) chance of failing. With 10 validators, this is negligible.
        for (const prevOrdering of orderings) {
          assert(!_.isEqual(prevOrdering, ordering), 'ordering is not unique')
        }
        orderings.push(ordering)
      }
    })
  })
})
