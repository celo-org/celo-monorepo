import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertContainSubset, assertEqualBN, assertRevert } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  MockElectionContract,
  MockElectionInstance,
  EpochRewardsTestContract,
  EpochRewardsTestInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'
import { toFixed } from '@celo/utils/lib/fixidity'

const EpochRewards: EpochRewardsTestContract = artifacts.require('EpochRewardsTest')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
EpochRewards.numberFormat = 'BigNumber'

contract('EpochRewards', (accounts: string[]) => {
  let epochRewards: EpochRewardsTestInstance
  let mockElection: MockElectionInstance
  let registry: RegistryInstance
  const nonOwner = accounts[1]

  const targetVotingYieldParams = {
    initial: toFixed(new BigNumber(1 / 20)),
    max: toFixed(new BigNumber(1 / 5)),
    adjustmentFactor: toFixed(new BigNumber(1)),
  }
  const rewardsMultiplierAdjustments = {
    underspend: toFixed(new BigNumber(1 / 2)),
    overspend: toFixed(new BigNumber(5)),
  }
  const maxValidatorEpochPayment = new BigNumber(10000000000000)
  beforeEach(async () => {
    epochRewards = await EpochRewards.new()
    mockElection = await MockElection.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await epochRewards.initialize(
      registry.address,
      targetVotingYieldParams.initial,
      targetVotingYieldParams.max,
      targetVotingYieldParams.adjustmentFactor,
      rewardsMultiplierAdjustments.underspend,
      rewardsMultiplierAdjustments.overspend,
      maxValidatorEpochPayment
    )
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await epochRewards.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set the max validator epoch payment', async () => {
      assertEqualBN(await epochRewards.maxValidatorEpochPayment(), maxValidatorEpochPayment)
    })

    it('should have set the target voting yield parameters', async () => {
      const [target, max, adjustmentFactor] = await epochRewards.getTargetVotingYieldParameters()
      assertEqualBN(target, targetVotingYieldParams.initial)
      assertEqualBN(max, targetVotingYieldParams.max)
      assertEqualBN(adjustmentFactor, targetVotingYieldParams.adjustmentFactor)
    })

    it('should have set the rewards multiplier adjustment factors', async () => {
      const [underspend, overspend] = await epochRewards.getRewardsMultiplierAdjustmentFactors()
      assertEqualBN(underspend, rewardsMultiplierAdjustments.underspend)
      assertEqualBN(overspend, rewardsMultiplierAdjustments.overspend)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        epochRewards.initialize(
          registry.address,
          targetVotingYieldParams.initial,
          targetVotingYieldParams.max,
          targetVotingYieldParams.adjustmentFactor,
          rewardsMultiplierAdjustments.underspend,
          rewardsMultiplierAdjustments.overspend,
          maxValidatorEpochPayment
        )
      )
    })
  })

  describe('#setMaxValidatorEpochPayment()', () => {
    describe('when the payment is different', () => {
      const newPayment = maxValidatorEpochPayment.plus(1)

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await epochRewards.setMaxValidatorEpochPayment(newPayment)
        })

        it('should set the max validator epoch payment', async () => {
          assertEqualBN(await epochRewards.maxValidatorEpochPayment(), newPayment)
        })

        it('should emit the MaxValidatorEpochPaymentSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'MaxValidatorEpochPaymentSet',
            args: {
              payment: newPayment,
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              epochRewards.setMaxValidatorEpochPayment(newPayment, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the payment is the same', () => {
        it('should revert', async () => {
          await assertRevert(epochRewards.setMaxValidatorEpochPayment(maxValidatorEpochPayment))
        })
      })
    })
  })

  describe('#setRewardsMultiplierAdjustmentFactors()', () => {
    describe('when the factors are different', () => {
      const newFactors = {
        underspend: rewardsMultiplierAdjustments.underspend.plus(1),
        overspend: rewardsMultiplierAdjustments.overspend.plus(1),
      }

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await epochRewards.setRewardsMultiplierAdjustmentFactors(
            newFactors.underspend,
            newFactors.overspend
          )
        })

        it('should set the new rewards multiplier adjustment factors', async () => {
          const [underspend, overspend] = await epochRewards.getRewardsMultiplierAdjustmentFactors()
          assertEqualBN(underspend, newFactors.underspend)
          assertEqualBN(overspend, newFactors.overspend)
        })

        it('should emit the RewardsMultiplierAdjustmentFactorsSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'RewardsMultiplierAdjustmentFactorsSet',
            args: {
              underspend: newFactors.underspend,
              overspend: newFactors.overspend,
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              epochRewards.setRewardsMultiplierAdjustmentFactors(
                newFactors.underspend,
                newFactors.overspend,
                {
                  from: nonOwner,
                }
              )
            )
          })
        })
      })

      describe('when the parameters are the same', () => {
        it('should revert', async () => {
          await assertRevert(
            epochRewards.setRewardsMultiplierAdjustmentFactors(
              rewardsMultiplierAdjustments.underspend,
              rewardsMultiplierAdjustments.overspend
            )
          )
        })
      })
    })
  })

  describe('#setTargetVotingYieldParameters()', () => {
    describe('when the parameters are different', () => {
      const newMax = targetVotingYieldParams.max.plus(1)
      const newFactor = targetVotingYieldParams.adjustmentFactor.plus(1)

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await epochRewards.setTargetVotingYieldParameters(newMax, newFactor)
        })

        it('should set the new target voting yield parameters', async () => {
          const [, max, adjustmentFactor] = await epochRewards.getTargetVotingYieldParameters()
          assertEqualBN(max, newMax)
          assertEqualBN(adjustmentFactor, newFactor)
        })

        it('should emit the TargetVotingYieldParametersSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'TargetVotingYieldParametersSet',
            args: {
              max: newMax,
              adjustmentFactor: newFactor,
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              epochRewards.setTargetVotingYieldParameters(newMax, newFactor, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the parameters are the same', () => {
        it('should revert', async () => {
          await assertRevert(
            epochRewards.setTargetVotingYieldParameters(
              targetVotingYieldParams.max,
              targetVotingYieldParams.adjustmentFactor
            )
          )
        })
      })
    })
  })
})
