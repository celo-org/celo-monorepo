import { assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import { QuorumContract, QuorumInstance } from 'types'

const Quorum: QuorumContract = artifacts.require('Quorum')

// @ts-ignore
// TODO(mcortesi): Use BN.js
Quorum.numberFormat = 'BigNumber'

contract('Quorum', () => {
  const initialQuorumNumerator = 50
  const initialQuorumDenominator = 100
  const quorumFloorNumerator = 5
  const quorumFloorDenominator = 100
  let quorum: QuorumInstance
  beforeEach(async () => {
    quorum = await Quorum.new()
    await quorum.initialize(
      initialQuorumNumerator,
      initialQuorumDenominator,
      quorumFloorNumerator,
      quorumFloorDenominator
    )
    BigNumber.config({ DECIMAL_PLACES: 17, ROUNDING_MODE: BigNumber.ROUND_HALF_UP })
  })

  describe('#initialize', () => {
    it('should have set the quorum', async () => {
      const [qNum, qDenom] = await quorum.getQuorumBaseline()
      assert.equal(qNum.toNumber(), initialQuorumNumerator)
      assert.equal(qDenom.toNumber(), initialQuorumDenominator)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        quorum.initialize(
          initialQuorumNumerator,
          initialQuorumDenominator,
          quorumFloorNumerator,
          quorumFloorDenominator
        )
      )
    })
  })

  function assertFractionEqual(num1: number, denom1: number, num2: number, denom2: number) {
    assert.isTrue(num1 * denom2 === num2 * denom1)
  }

  describe('#threshold', () => {
    it('should revert at undefined participation', async () => {
      await assertRevert(quorum.threshold(0, 0, 70, 100, 1, 2))
    })

    describe('when the quorum baseline is low', () => {
      const lowInitialQuorumNumerator = 20
      const lowInitialQuorumDenominator = 100
      const baseThresholdNumerator = 70
      const baseThresholdDenominator = 100
      const kFactorNumerator = 1
      const kFactorDenominator = 2
      beforeEach(async () => {
        quorum = await Quorum.new()
        await quorum.initialize(
          lowInitialQuorumNumerator,
          lowInitialQuorumDenominator,
          quorumFloorNumerator,
          quorumFloorDenominator
        )
      })

      it('should return the correct threshold at low participation', async () => {
        const totalVotes = 10
        const totalWeight = 100
        const [tNum, tDenom] = await quorum.threshold(
          totalVotes,
          totalWeight,
          baseThresholdNumerator,
          baseThresholdDenominator,
          kFactorNumerator,
          kFactorDenominator
        )
        const expectedNum = 80
        const expectedDenom = 100
        assertFractionEqual(tNum.toNumber(), tDenom.toNumber(), expectedNum, expectedDenom)
      })

      it('should return the correct threshold at medium participation', async () => {
        const totalVotes = 50
        const totalWeight = 100
        const [tNum, tDenom] = await quorum.threshold(
          totalVotes,
          totalWeight,
          baseThresholdNumerator,
          baseThresholdDenominator,
          kFactorNumerator,
          kFactorDenominator
        )
        const expectedNum = 60
        const expectedDenom = 100
        assertFractionEqual(tNum.toNumber(), tDenom.toNumber(), expectedNum, expectedDenom)
      })

      it('should return the correct threshold at high participation', async () => {
        const totalVotes = 90
        const totalWeight = 100
        const [tNum, tDenom] = await quorum.threshold(
          totalVotes,
          totalWeight,
          baseThresholdNumerator,
          baseThresholdDenominator,
          kFactorNumerator,
          kFactorDenominator
        )
        const expectedNum = 56
        const expectedDenom = 100
        assertFractionEqual(tNum.toNumber(), tDenom.toNumber(), expectedNum, expectedDenom)
      })
    })

    describe('when the quorum baseline is high', () => {
      const highInitialQuorumNumerator = 80
      const highInitialQuorumDenominator = 100
      const baseThresholdNumerator = 70
      const baseThresholdDenominator = 100
      const kFactorNumerator = 1
      const kFactorDenominator = 2
      beforeEach(async () => {
        quorum = await Quorum.new()
        await quorum.initialize(
          highInitialQuorumNumerator,
          highInitialQuorumDenominator,
          quorumFloorNumerator,
          quorumFloorDenominator
        )
      })

      it('should return the correct threshold at low participation', async () => {
        const totalVotes = 10
        const totalWeight = 100
        const [tNum, tDenom] = await quorum.threshold(
          totalVotes,
          totalWeight,
          baseThresholdNumerator,
          baseThresholdDenominator,
          kFactorNumerator,
          kFactorDenominator
        )
        const expectedNum = 98
        const expectedDenom = 100
        assertFractionEqual(tNum.toNumber(), tDenom.toNumber(), expectedNum, expectedDenom)
      })

      it('should return the correct threshold at medium participation', async () => {
        const totalVotes = 40
        const totalWeight = 100
        const [tNum, tDenom] = await quorum.threshold(
          totalVotes,
          totalWeight,
          baseThresholdNumerator,
          baseThresholdDenominator,
          kFactorNumerator,
          kFactorDenominator
        )
        const expectedNum = 80
        const expectedDenom = 100
        assertFractionEqual(tNum.toNumber(), tDenom.toNumber(), expectedNum, expectedDenom)
      })

      it('should return the correct threshold at high participation', async () => {
        const totalVotes = 100
        const totalWeight = 100
        const [tNum, tDenom] = await quorum.threshold(
          totalVotes,
          totalWeight,
          baseThresholdNumerator,
          baseThresholdDenominator,
          kFactorNumerator,
          kFactorDenominator
        )
        const expectedNum = 47
        const expectedDenom = 70
        assertFractionEqual(tNum.toNumber(), tDenom.toNumber(), expectedNum, expectedDenom)
      })
    })
  })

  describe('#updateQuorumBaseline', () => {
    describe('when quorum does not overflow', () => {
      const totalVotes = 80
      const totalWeight = 100

      it('should update quorum baseline to correct value', async () => {
        await quorum.updateQuorumBaseline(totalVotes, totalWeight)
        const [qNum, qDenom] = await quorum.getQuorumBaseline()
        const expectedNum = 56
        const expectedDenom = 100
        assertFractionEqual(qNum.toNumber(), qDenom.toNumber(), expectedNum, expectedDenom)
      })

      it('should emit a QuorumUpdated event', async () => {
        const resp = await quorum.updateQuorumBaseline(totalVotes, totalWeight)
        const [qNum, qDenom] = await quorum.getQuorumBaseline()
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'QuorumUpdated',
          args: {
            quorumNumerator: qNum,
            quorumDenominator: qDenom,
          },
        })
      })
    })

    describe('when quorum overflows', () => {
      const largeQuorumNumerator = web3.utils.toBN('477345987239467349857936734')
      const largeQuorumDenominator = web3.utils.toBN('1091203940239235093109539501')
      const totalVotes = 783479873246
      const totalWeight = 1085729492949
      beforeEach(async () => {
        quorum = await Quorum.new()
        await quorum.initialize(
          largeQuorumNumerator,
          largeQuorumDenominator,
          quorumFloorNumerator,
          quorumFloorDenominator
        )
      })

      it('should update quorum baseline to approximate value', async () => {
        await quorum.updateQuorumBaseline(totalVotes, totalWeight)
        const [qNum, qDenom] = await quorum.getQuorumBaseline()
        const expected = 0.49428235584815016
        const epsilon = 1e-15
        const difference = qNum.div(qDenom).toNumber() - expected
        assert.isTrue(difference > -epsilon && difference < epsilon)
        assert.isTrue(qNum.isLessThan('1e30'))
        assert.isTrue(qDenom.isLessThan('1e30'))
      })

      it('should emit a QuorumUpdated event', async () => {
        const resp = await quorum.updateQuorumBaseline(totalVotes, totalWeight)
        const [qNum, qDenom] = await quorum.getQuorumBaseline()
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'QuorumUpdated',
          args: {
            quorumNumerator: qNum,
            quorumDenominator: qDenom,
          },
        })
      })
    })

    describe('when quorum falls below floor', () => {
      const lowQuorumNumerator = 55
      const lowQuorumDenominator = 1000
      const totalVotes = 5
      const totalWeight = 1000
      beforeEach(async () => {
        quorum = await Quorum.new()
        await quorum.initialize(
          lowQuorumNumerator,
          lowQuorumDenominator,
          quorumFloorNumerator,
          quorumFloorDenominator
        )
      })

      it('should update quorum baseline to floor value', async () => {
        await quorum.updateQuorumBaseline(totalVotes, totalWeight)
        const [qNum, qDenom] = await quorum.getQuorumBaseline()
        const expectedNum = 5
        const expectedDenom = 100
        assertFractionEqual(qNum.toNumber(), qDenom.toNumber(), expectedNum, expectedDenom)
      })

      it('should emit a QuorumUpdated event', async () => {
        const resp = await quorum.updateQuorumBaseline(totalVotes, totalWeight)
        const [qNum, qDenom] = await quorum.getQuorumBaseline()
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'QuorumUpdated',
          args: {
            quorumNumerator: qNum,
            quorumDenominator: qDenom,
          },
        })
      })
    })
  })
})
