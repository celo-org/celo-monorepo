import { toFixed } from '@celo/protocol/lib/fixidity'
import { assertEqualBN, assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
import { QuorumContract, QuorumInstance } from 'types'

const Quorum: QuorumContract = artifacts.require('Quorum')

// @ts-ignore
// TODO(mcortesi): Use BN.js
Quorum.numberFormat = 'BigNumber'

contract('Quorum', () => {
  const quorumBaseline = toFixed(50 / 100)
  const quorumFloor = toFixed(5 / 100)
  const updateCoefficient = toFixed(1 / 5)
  let quorum: QuorumInstance
  beforeEach(async () => {
    quorum = await Quorum.new()
    await quorum.initialize(quorumBaseline, quorumFloor, updateCoefficient)
  })

  describe('#initialize()', () => {
    it('should have set the quorum', async () => {
      const actualQuorum = await quorum.quorumBaseline()
      assertEqualBN(actualQuorum, quorumBaseline)
    })

    it('should not be callable again', async () => {
      await assertRevert(quorum.initialize(quorumBaseline, quorumFloor, updateCoefficient))
    })
  })

  describe('#adjustedSupport()', () => {
    const totalWeight = 100

    it('should return support ratio when participation above quorum', async () => {
      const yes = 15
      const no = 10
      const abstain = 30
      const expected = toFixed(3 / 5)
      const support = await quorum.adjustedSupport(yes, no, abstain, totalWeight)
      assertEqualBN(support, expected)
    })

    it('should return lowered support ratio when participation below quorum', async () => {
      const yes = 15
      const no = 10
      const abstain = 10
      // 20 "no" votes added
      const expected = toFixed(3 / 8)
      const support = await quorum.adjustedSupport(yes, no, abstain, totalWeight)
      assertEqualBN(support, expected)
    })

    it('should return 0 support ratio when 0 yes votes and 0 no votes are cast', async () => {
      const yes = 0
      const no = 0
      const abstain = 30
      const expected = toFixed(0)
      const support = await quorum.adjustedSupport(yes, no, abstain, totalWeight)
      assertEqualBN(support, expected)
    })
  })

  describe('#updateQuorumBaseline()', () => {
    const participation = toFixed(80 / 100)

    it('should update quorum baseline to correct value', async () => {
      await quorum.updateQuorumBaseline(participation)
      const newQuorumBaseline = await quorum.quorumBaseline()
      const expected = toFixed(56 / 100)
      assertEqualBN(newQuorumBaseline, expected)
    })

    it('should emit a QuorumUpdated event', async () => {
      const resp = await quorum.updateQuorumBaseline(participation)
      const newQuorumBaseline = await quorum.quorumBaseline()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'QuorumUpdated',
        args: {
          quorum: newQuorumBaseline,
        },
      })
    })

    describe('when quorum falls below floor', () => {
      const lowQuorumBaseline = toFixed(55 / 1000)
      const lowParticipation = toFixed(5 / 1000)
      beforeEach(async () => {
        quorum = await Quorum.new()
        await quorum.initialize(lowQuorumBaseline, quorumFloor, updateCoefficient)
      })

      it('should update quorum baseline to floor value', async () => {
        await quorum.updateQuorumBaseline(lowParticipation)
        const newQuorumBaseline = await quorum.quorumBaseline()
        const expected = toFixed(5 / 100)
        assertEqualBN(newQuorumBaseline, expected)
      })

      it('should emit a QuorumUpdated event', async () => {
        const resp = await quorum.updateQuorumBaseline(lowParticipation)
        const newQuorumBaseline = await quorum.quorumBaseline()
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'QuorumUpdated',
          args: {
            quorum: newQuorumBaseline,
          },
        })
      })
    })
  })
})
