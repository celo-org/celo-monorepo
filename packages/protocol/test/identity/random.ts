import { assertRevert, assertEqualBN, assertContainSubset } from '@celo/protocol/lib/test-utils'

import { TestRandomContract, TestRandomInstance } from 'types'
import { BigNumber } from 'bignumber.js'

const Random: TestRandomContract = artifacts.require('TestRandom')

// @ts-ignore
// TODO(mcortesi): Use BN
Random.numberFormat = 'BigNumber'

contract('Random', (accounts: string[]) => {
  let random: TestRandomInstance

  beforeEach(async () => {
    random = await Random.new()
    random.initialize(256)
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
      assertRevert(random.setRandomnessBlockRetentionWindow(1000, { from: accounts[1] }))
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
        assertRevert(random.getTestRandomness(3, 5))
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
        assertRevert(random.getTestRandomness(1, 5))
      })
      it('old values are preserved', async () => {
        await random.addTestRandomness(5, randomValues[5])
        await random.addTestRandomness(6, randomValues[6])
        assert.equal(randomValues[3], await random.getTestRandomness(3, 6))
      })
    })
  })
})
