import {
  assertContainSubset,
  assertEqualBN,
  assertRevert,
  currentEpochNumber,
  EPOCH,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import { RandomTestContract, RandomTestInstance } from 'types'

const Random: RandomTestContract = artifacts.require('RandomTest')

// @ts-ignore
// TODO(mcortesi): Use BN
Random.numberFormat = 'BigNumber'

contract('Random', (accounts: string[]) => {
  let random: RandomTestInstance

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
      let lastEpochBlock: any
      let currentBlock: any
      const retentionWindow = 5
      beforeEach(async () => {
        const epochNumber = await currentEpochNumber(web3)
        currentBlock = (epochNumber + 1) * EPOCH
        await timeTravel(currentBlock, web3)

        await random.setRandomnessBlockRetentionWindow(retentionWindow)
        // Starting on epoch i, it should add randomness for epoch i's last block
        // Then it should add randomness for all of epoch i+1's blocks (including its last)
        // This should overlap the original lastEpochBlock.
        for (let i = 0; i <= EPOCH; i++) {
          if (currentBlock % EPOCH === 0) {
            lastEpochBlock = currentBlock
            await random.addTestRandomness(currentBlock, randomValues[1])
          } else {
            await random.addTestRandomness(currentBlock, randomValues[2])
          }
          currentBlock += 1
        }
        // Now we add `retentionWindow` worth of blocks' randomness to flush out the new lastEpochBlock
        // This means we can test `lastEpochBlock` stores epoch i+1's last block,
        // and we test that epoch i's last block is not retained.
        for (let i = 0; i < retentionWindow + 1; i++) {
          await random.addTestRandomness(currentBlock, randomValues[2])
          if (i !== retentionWindow) {
            currentBlock += 1
          }
        }
      })

      it("should retain the last epoch block's randomness", async () => {
        // Get start of epoch and then subtract one for last block of previous epoch
        assert.equal(randomValues[1], await random.getTestRandomness(lastEpochBlock, currentBlock))
      })

      it('should retain the usual `retentionWindow` worth of blocks', async () => {
        for (let i = 0; i < retentionWindow; i++) {
          assert.equal(
            randomValues[2],
            await random.getTestRandomness(currentBlock - i, currentBlock)
          )
        }
      })

      it('should still not retain other blocks not covered by the retention window', async () => {
        await assertRevert(random.getTestRandomness(currentBlock - retentionWindow, currentBlock))
      })

      it('should not retain the last epoch block of previous epochs', async () => {
        await assertRevert(random.getTestRandomness(lastEpochBlock - EPOCH, currentBlock))
      })
    })
  })

  describe('#testRevealAndCommit', () => {
    const hash0 = web3.utils.soliditySha3({ type: 'bytes32', v: '0x00' })
    const hash1 = web3.utils.soliditySha3({ type: 'bytes32', v: '0x01' })
    const hash2 = web3.utils.soliditySha3({ type: 'bytes32', v: '0x02' })
    beforeEach(async () => {
      await random.setRandomnessBlockRetentionWindow(256)
    })
    it('cannot add zero commitment', async () => {
      await assertRevert(random.testRevealAndCommit('0x0', hash0, accounts[0]))
    })
    it('can add initial commitment', async () => {
      await random.testRevealAndCommit('0x0', hash1, accounts[0])
    })
    it('can reveal initial commitment', async () => {
      await random.testRevealAndCommit('0x0', hash1, accounts[0])
      const resp = await random.testRevealAndCommit('0x01', hash2, accounts[0])
      const blockNumber = resp.receipt.blockNumber
      const lastRandomness = await random.getBlockRandomness(blockNumber - 1)
      const expected = web3.utils.soliditySha3(
        { type: 'bytes32', v: lastRandomness },
        { type: 'bytes32', v: '0x01' }
      )
      assert.equal(await random.getBlockRandomness(blockNumber), expected)
    })
  })
})
