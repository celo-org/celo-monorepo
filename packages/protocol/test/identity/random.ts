import {
  assertContainSubset,
  assertEqualBN,
  assertRevert,
  currentEpochNumber,
  EPOCH,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import { TestRandomContract, TestRandomInstance } from 'types'

const Random: TestRandomContract = artifacts.require('TestRandom')

// @ts-ignore
// TODO(mcortesi): Use BN
Random.numberFormat = 'BigNumber'

contract('Random', (accounts: string[]) => {
  let random: TestRandomInstance

  beforeEach(async () => {
    random = await Random.new()
    await random.initialize(256)
  })

  describe('#setRandomnessRetentionWindow()', () => {
    it('should set the variable', async () => {
      await random.setRandomnessBlockRetentionWindow(1000)
      assertEqualBN(new BigNumber(1000), await random.randomnessBlockRetentionWindow())
    })

    it('should emit the event', async () => {
      const response = await random.setRandomnessBlockRetentionWindow(1000)
      assert.equal(response.logs.length, 1)
      const log = response.logs[0]
      assertContainSubset(log, {
        event: 'RandomnessBlockRetentionWindowSet',
        args: {
          value: new BigNumber(1000),
        },
      })
    })

    it('only owner can set', async () => {
      await assertRevert(random.setRandomnessBlockRetentionWindow(1000, { from: accounts[1] }))
    })
  })

  describe('#addTestRandomness', () => {
    const randomValues = [
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      '0x0000000000000000000000000000000000000000000000000000000000000002',
      '0x0000000000000000000000000000000000000000000000000000000000000003',
      '0x0000000000000000000000000000000000000000000000000000000000000004',
      '0x0000000000000000000000000000000000000000000000000000000000000005',
      '0x0000000000000000000000000000000000000000000000000000000000000006',
      '0x0000000000000000000000000000000000000000000000000000000000000007',
    ]
    it('should be able to simulate adding randomness', async () => {
      await random.addTestRandomness(1, randomValues[1])
      await random.addTestRandomness(2, randomValues[2])
      await random.addTestRandomness(3, randomValues[3])
      await random.addTestRandomness(4, randomValues[4])
      assert.equal(randomValues[1], await random.getTestRandomness(1, 4))
      assert.equal(randomValues[2], await random.getTestRandomness(2, 4))
      assert.equal(randomValues[3], await random.getTestRandomness(3, 4))
      assert.equal(randomValues[4], await random.getTestRandomness(4, 4))
    })

    describe('when changing history smaller', () => {
      beforeEach(async () => {
        await random.addTestRandomness(1, randomValues[1])
        await random.addTestRandomness(2, randomValues[2])
        await random.addTestRandomness(3, randomValues[3])
        await random.addTestRandomness(4, randomValues[4])
        await random.setRandomnessBlockRetentionWindow(2)
      })
      it('can still add randomness', async () => {
        await random.addTestRandomness(5, randomValues[5])
        assert.equal(randomValues[5], await random.getTestRandomness(5, 5))
      })
      it('cannot read old blocks', async () => {
        await assertRevert(random.getTestRandomness(3, 5))
      })
    })

    describe('when changing history larger', () => {
      beforeEach(async () => {
        await random.setRandomnessBlockRetentionWindow(2)
        await random.addTestRandomness(1, randomValues[1])
        await random.addTestRandomness(2, randomValues[2])
        await random.addTestRandomness(3, randomValues[3])
        await random.addTestRandomness(4, randomValues[4])
        await random.setRandomnessBlockRetentionWindow(4)
      })
      it('can still add randomness', async () => {
        await random.addTestRandomness(5, randomValues[5])
        assert.equal(randomValues[5], await random.getTestRandomness(5, 5))
      })
      it('cannot read old blocks', async () => {
        await assertRevert(random.getTestRandomness(1, 5))
      })
      it('old values are preserved', async () => {
        await random.addTestRandomness(5, randomValues[5])
        await random.addTestRandomness(6, randomValues[6])
        assert.equal(randomValues[3], await random.getTestRandomness(3, 6))
      })
    })

    describe("when relying on the last block of each epoch's randomness", async () => {
      let lastBlockOfEpoch: any
      let totalBlocks: any
      const retentionWindow = 5
      beforeEach(async () => {
        const epochNumber = await currentEpochNumber(web3)
        lastBlockOfEpoch = (epochNumber + 1) * EPOCH - 2
        await timeTravel(lastBlockOfEpoch, web3)
        totalBlocks = lastBlockOfEpoch

        await random.setRandomnessBlockRetentionWindow(retentionWindow)
        // Starting on epoch i, it should add randomness for epoch i's last block
        // Then it should add randomness for all of epoch i+1's blocks (including its last)
        // This should overlap the original lastEpochBlock.
        for (let i = 0; i <= EPOCH; i++) {
          totalBlocks += 1
          if ((totalBlocks + 1) % EPOCH === 0) {
            await random.addTestRandomness(totalBlocks, randomValues[0])
          } else {
            await random.addTestRandomness(totalBlocks, randomValues[1])
          }
        }
        // Now we add `retentionWindow` worth of blocks' randomness to flush out the new lastEpochBlock
        // This means we can test `lastEpochBlock` stores epoch i+1's last block,
        // and we test that epoch i's last block is not retained.
        for (let i = 0; i < retentionWindow + 1; i++) {
          totalBlocks += 1
          await random.addTestRandomness(totalBlocks, randomValues[1])
        }
      })

      it("should retain the last epoch block's randomness", async () => {
        // Get start of epoch and then subtract one for last block of previous epoch
        const lastEpochBlock = totalBlocks - (totalBlocks % EPOCH) - 1
        assert.equal(randomValues[0], await random.getTestRandomness(lastEpochBlock, totalBlocks))
      })

      it('should retain the usual `retentionWindow` worth of blocks', async () => {
        for (let i = 0; i < retentionWindow; i++) {
          assert.equal(
            randomValues[1],
            await random.getTestRandomness(totalBlocks - i, totalBlocks)
          )
        }
      })

      it('should still not retain other blocks not covered by the retention window', async () => {
        await assertRevert(random.getTestRandomness(totalBlocks - retentionWindow, totalBlocks))
      })

      it('should not retain the last epoch block of previous epochs', async () => {
        const lastEpochBlock = totalBlocks - (totalBlocks % EPOCH) - 1
        const previousLastEpochBlock = lastEpochBlock - EPOCH
        await assertRevert(random.getTestRandomness(previousLastEpochBlock, totalBlocks))
      })
    })
  })
})
