import { assert } from 'chai'
import _ from 'lodash'
import Web3 from 'web3'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getContext, sleep } from './utils'

const VALIDATORS = 10
const EPOCH = 20
const EPOCHS_TO_WAIT = 3
const BLOCK_COUNT = EPOCH * EPOCHS_TO_WAIT

const TMP_PATH = '/tmp/e2e'

describe('governance tests', () => {
  const gethConfig: GethRunConfig = {
    networkId: 1101,
    network: 'local',
    runPath: TMP_PATH,
    migrateTo: 19,
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
  let web3: Web3

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(async function(this: any) {
    this.timeout(0)
    await context.hooks.after()
  })

  describe('Validator ordering', () => {
    before(async function() {
      this.timeout(0)
      web3 = new Web3('http://localhost:8545')
      await context.hooks.restart()
    })

    it('properly orders validators randomly', async function(this: any) {
      this.timeout(160000 /* 160 seconds */)
      // If a consensus round fails during this test, the results are inconclusive.
      // Retry up to two times to mitigate this issue. Restarting the nodes is not needed.
      this.retries(2)

      const latestBlockNumber = (await web3.eth.getBlock('latest')).number
      const indexInEpoch = ((latestBlockNumber % EPOCH) + EPOCH - 1) % EPOCH
      const nextEpoch = latestBlockNumber + (EPOCH - indexInEpoch)

      // Wait for enough blocks.
      while ((await web3.eth.getBlock('latest')).number < nextEpoch + BLOCK_COUNT) {
        await sleep(2)
      }

      // Fetch the validator for each block.
      const blocks = await Promise.all(
        _.range(BLOCK_COUNT).map(async (i) => web3.eth.getBlock(i + nextEpoch))
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
