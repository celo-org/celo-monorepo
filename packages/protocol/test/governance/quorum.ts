import { toFixed } from '@celo/protocol/lib/fixidity'
import { assertEqualBN, assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
import { QuorumContract, QuorumInstance } from 'types'

const Quorum: QuorumContract = artifacts.require('Quorum')

// @ts-ignore
// TODO(mcortesi): Use BN.js
Quorum.numberFormat = 'BigNumber'

contract('Quorum', () => {
  const participationBaseline = toFixed(50 / 100)
  const participationFloor = toFixed(5 / 100)
  const updateCoefficient = toFixed(1 / 5)
  const criticalBaselineLevel = toFixed(1)
  let quorum: QuorumInstance
  beforeEach(async () => {
    quorum = await Quorum.new()
    await quorum.initialize(
      participationBaseline,
      participationFloor,
      updateCoefficient,
      criticalBaselineLevel
    )
  })

  describe('#initialize()', () => {
    it('should have set the participation baseline', async () => {
      const actualParticipationBaseline = await quorum.participationBaseline()
      assertEqualBN(actualParticipationBaseline, participationBaseline)
    })

    it('should have set the participation floor', async () => {
      const actualParticipationFloor = await quorum.participationFloor()
      assertEqualBN(actualParticipationFloor, participationFloor)
    })

    it('should have set the update coefficient', async () => {
      const actualUpdateCoefficient = await quorum.updateCoefficient()
      assertEqualBN(actualUpdateCoefficient, updateCoefficient)
    })

    it('should have set the critical baseline level', async () => {
      const actualCriticalBaselineLevel = await quorum.criticalBaselineLevel()
      assertEqualBN(actualCriticalBaselineLevel, criticalBaselineLevel)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        quorum.initialize(
          participationBaseline,
          participationFloor,
          updateCoefficient,
          criticalBaselineLevel
        )
      )
    })
  })

  describe('#setParticipationFloor', () => {
    const differentParticipationFloor = toFixed(2 / 100)

    it('should set the participation floor', async () => {
      await quorum.setParticipationFloor(differentParticipationFloor)
      const actualParticipationFloor = await quorum.participationFloor()
      assertEqualBN(actualParticipationFloor, differentParticipationFloor)
    })

    it('should revert if new participation floor is below 0', async () => {
      await assertRevert(quorum.setParticipationFloor(toFixed(-1 / 100)))
    })

    it('should revert if new participation floor is above 1', async () => {
      await assertRevert(quorum.setParticipationFloor(toFixed(101 / 100)))
    })
  })

  describe('#setUpdateCoefficient', () => {
    const differentUpdateCoefficient = toFixed(2 / 100)

    it('should set the update coefficient', async () => {
      await quorum.setUpdateCoefficient(differentUpdateCoefficient)
      const actualUpdateCoefficient = await quorum.updateCoefficient()
      assertEqualBN(actualUpdateCoefficient, differentUpdateCoefficient)
    })

    it('should revert if new update coefficient is below 0', async () => {
      await assertRevert(quorum.setUpdateCoefficient(toFixed(-1 / 100)))
    })

    it('should revert if new update coefficient is above 1', async () => {
      await assertRevert(quorum.setUpdateCoefficient(toFixed(101 / 100)))
    })
  })

  describe('#setCriticalBaselineLevel', () => {
    const differentCriticalBaselineLevel = toFixed(2 / 100)

    it('should set the critical baseline level', async () => {
      await quorum.setCriticalBaselineLevel(differentCriticalBaselineLevel)
      const actualCriticalBaselineLevel = await quorum.criticalBaselineLevel()
      assertEqualBN(actualCriticalBaselineLevel, differentCriticalBaselineLevel)
    })

    it('should revert if new critical baseline level is below 0', async () => {
      await assertRevert(quorum.setCriticalBaselineLevel(toFixed(-1 / 100)))
    })

    it('should revert if new critical baseline level is above 1', async () => {
      await assertRevert(quorum.setCriticalBaselineLevel(toFixed(101 / 100)))
    })
  })

  describe('#adjustedSupport()', () => {
    const totalWeight = 100

    it('should return support ratio when participation above critical baseline', async () => {
      const yes = 15
      const no = 10
      const abstain = 30
      const expected = toFixed(yes / (yes + no))
      const support = await quorum.adjustedSupport(yes, no, abstain, totalWeight)
      assertEqualBN(support, expected)
    })

    it('should return lowered support ratio when participation below critical baseline', async () => {
      const yes = 15
      const no = 10
      const abstain = 10
      // 15 "no" votes added to reach quorum of 50 votes (50% baseline * 100 total weight)
      const addedNo = 50 - yes - no - abstain
      const expected = toFixed(yes / (yes + no + addedNo))
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

  describe('#updateParticipationBaseline()', () => {
    const participation = toFixed(80 / 100)

    it('should update participation baseline to correct value', async () => {
      await quorum.updateParticipationBaseline(participation)
      const newParticipationBaseline = await quorum.participationBaseline()
      const expected = toFixed(0.2 * (80 / 100) + 0.8 * (50 / 100))
      assertEqualBN(newParticipationBaseline, expected)
    })

    it('should emit a ParticipationBaselineUpdated event', async () => {
      const resp = await quorum.updateParticipationBaseline(participation)
      const newParticipationBaseline = await quorum.participationBaseline()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ParticipationBaselineUpdated',
        args: {
          participationBaseline: newParticipationBaseline,
        },
      })
    })

    describe('when participation baseline falls below floor', () => {
      const lowParticipationBaseline = toFixed(55 / 1000)
      const lowParticipation = toFixed(5 / 1000)
      beforeEach(async () => {
        quorum = await Quorum.new()
        await quorum.initialize(
          lowParticipationBaseline,
          participationFloor,
          updateCoefficient,
          criticalBaselineLevel
        )
      })

      it('should update participation baseline to floor value', async () => {
        await quorum.updateParticipationBaseline(lowParticipation)
        const newParticipationBaseline = await quorum.participationBaseline()
        const expected = participationFloor
        assertEqualBN(newParticipationBaseline, expected)
      })

      it('should emit a ParticipationBaselineUpdated event', async () => {
        const resp = await quorum.updateParticipationBaseline(lowParticipation)
        const newParticipationBaseline = await quorum.participationBaseline()
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ParticipationBaselineUpdated',
          args: {
            participationBaseline: newParticipationBaseline,
          },
        })
      })
    })
  })
})
