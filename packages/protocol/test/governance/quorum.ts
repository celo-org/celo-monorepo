import { assertFractionEqual, assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
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
