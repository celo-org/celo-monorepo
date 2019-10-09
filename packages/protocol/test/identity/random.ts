import { assertRevert } from '@celo/protocol/lib/test-utils'

import { TestRandomContract, TestRandomInstance } from 'types'

const Random: TestRandomContract = artifacts.require('TestRandom')

contract('Random', (/* accounts: string[] */) => {
  let random: TestRandomInstance

  beforeEach(async () => {
    random = await Random.new()
  })

  describe('#testRandomness', () => {
    it('should be able to simulate adding randomness', async () => {
      await random.testRandomness(1, '0x01')
      await random.testRandomness(2, '0x02')
      await random.testRandomness(3, '0x03')
      await random.testRandomness(4, '0x04')
      assert.equal(
        '0x0100000000000000000000000000000000000000000000000000000000000000',
        await random.getTestRandomness(1, 4)
      )
      assert.equal(
        '0x0200000000000000000000000000000000000000000000000000000000000000',
        await random.getTestRandomness(2, 4)
      )
      assert.equal(
        '0x0300000000000000000000000000000000000000000000000000000000000000',
        await random.getTestRandomness(3, 4)
      )
      assert.equal(
        '0x0400000000000000000000000000000000000000000000000000000000000000',
        await random.getTestRandomness(4, 4)
      )
    })

    describe('when changing history smaller', () => {
      beforeEach(async () => {
        await random.testRandomness(1, '0x01')
        await random.testRandomness(2, '0x02')
        await random.testRandomness(3, '0x03')
        await random.testRandomness(4, '0x04')
        await random.setRandomnessBlockRetentionWindow(2)
      })
      it('can still add randomness', async () => {
        await random.testRandomness(5, '0x05')
        assert.equal(
          '0x0500000000000000000000000000000000000000000000000000000000000000',
          await random.getTestRandomness(5, 5)
        )
      })
      it('cannot read old blocks', async () => {
        assertRevert(random.getTestRandomness(1, 5))
      })
    })

    describe('when changing history larger', () => {
      beforeEach(async () => {
        await random.setRandomnessBlockRetentionWindow(2)
        await random.testRandomness(1, '0x01')
        await random.testRandomness(2, '0x02')
        await random.testRandomness(3, '0x03')
        await random.testRandomness(4, '0x04')
        await random.setRandomnessBlockRetentionWindow(4)
      })
      it('can still add randomness', async () => {
        await random.testRandomness(5, '0x05')
        assert.equal(
          '0x0500000000000000000000000000000000000000000000000000000000000000',
          await random.getTestRandomness(5, 5)
        )
      })
      it('cannot read old blocks', async () => {
        assertRevert(random.getTestRandomness(1, 5))
      })
    })
  })
})
