import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertAlmostEqualBN,
  assertContainSubset,
  assertEqualBN,
  assertEqualDpBN,
  assertRevert,
  jsonRpc,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  EpochRewardsTestContract,
  EpochRewardsTestInstance,
  FreezerContract,
  FreezerInstance,
  MockElectionContract,
  MockElectionInstance,
  MockGoldTokenContract,
  MockGoldTokenInstance,
  MockSortedOraclesContract,
  MockSortedOraclesInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  RegistryContract,
  RegistryInstance,
  ReserveContract,
  ReserveInstance,
} from 'types'

const EpochRewards: EpochRewardsTestContract = artifacts.require('EpochRewardsTest')
const Freezer: FreezerContract = artifacts.require('Freezer')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockGoldToken: MockGoldTokenContract = artifacts.require('MockGoldToken')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const Registry: RegistryContract = artifacts.require('Registry')
const Reserve: ReserveContract = artifacts.require('Reserve')

// @ts-ignore
// TODO(mcortesi): Use BN
EpochRewards.numberFormat = 'BigNumber'

const YEAR = new BigNumber(365 * 24 * 60 * 60)
const SUPPLY_CAP = new BigNumber(web3.utils.toWei('1000000000'))

const getExpectedTargetTotalSupply = (timeDelta: BigNumber): BigNumber => {
  const genesisSupply = new BigNumber(web3.utils.toWei('600000000'))
  const linearRewards = new BigNumber(web3.utils.toWei('200000000'))
  return genesisSupply
    .plus(timeDelta.times(linearRewards).div(YEAR.times(15)))
    .integerValue(BigNumber.ROUND_FLOOR)
}

contract('EpochRewards', (accounts: string[]) => {
  let epochRewards: EpochRewardsTestInstance
  let freezer: FreezerInstance
  let mockElection: MockElectionInstance
  let mockGoldToken: MockGoldTokenInstance
  let mockStableToken: MockStableTokenInstance
  let mockSortedOracles: MockSortedOraclesInstance
  let registry: RegistryInstance
  const nonOwner = accounts[1]

  const targetVotingYieldParams = {
    initial: toFixed(new BigNumber(1 / 20)),
    max: toFixed(new BigNumber(1 / 5)),
    adjustmentFactor: toFixed(new BigNumber(1 / 365)),
  }
  const rewardsMultiplier = {
    max: toFixed(new BigNumber(2)),
    adjustments: {
      underspend: toFixed(new BigNumber(1 / 2)),
      overspend: toFixed(new BigNumber(5)),
    },
  }
  const targetVotingGoldFraction = toFixed(new BigNumber(2 / 3))
  const communityRewardFraction = toFixed(new BigNumber(1 / 4))
  const carbonOffsettingFraction = toFixed(new BigNumber(1 / 200))
  const carbonOffsettingPartner = '0x0000000000000000000000000000000000000000'
  const targetValidatorEpochPayment = new BigNumber(10000000000000)
  const exchangeRate = 7
  const sortedOraclesDenominator = new BigNumber('0x10000000000000000')
  const timeTravelToDelta = async (timeDelta: BigNumber) => {
    // mine beforehand, just in case
    await jsonRpc(web3, 'evm_mine', [])
    const currentTime: BigNumber = new BigNumber((await web3.eth.getBlock('latest')).timestamp)
    const startTime: BigNumber = await epochRewards.startTime()
    const desiredTime: BigNumber = startTime.plus(timeDelta)
    const delta: number = desiredTime.minus(currentTime).toNumber()
    await timeTravel(delta, web3)
  }
  const initialAssetAllocationSymbols = [web3.utils.padRight(web3.utils.utf8ToHex('cGLD'), 64)]
  const initialAssetAllocationWeights = [toFixed(1)]

  beforeEach(async () => {
    epochRewards = await EpochRewards.new()
    mockElection = await MockElection.new()
    mockGoldToken = await MockGoldToken.new()
    mockStableToken = await MockStableToken.new()
    mockSortedOracles = await MockSortedOracles.new()
    freezer = await Freezer.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.Freezer, freezer.address)
    await registry.setAddressFor(CeloContractName.GoldToken, mockGoldToken.address)
    await registry.setAddressFor(CeloContractName.SortedOracles, mockSortedOracles.address)
    await registry.setAddressFor(CeloContractName.StableToken, mockStableToken.address)
    await mockSortedOracles.setMedianRate(
      mockStableToken.address,
      sortedOraclesDenominator.times(exchangeRate)
    )

    await epochRewards.initialize(
      registry.address,
      targetVotingYieldParams.initial,
      targetVotingYieldParams.max,
      targetVotingYieldParams.adjustmentFactor,
      rewardsMultiplier.max,
      rewardsMultiplier.adjustments.underspend,
      rewardsMultiplier.adjustments.overspend,
      targetVotingGoldFraction,
      targetValidatorEpochPayment,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction
    )
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await epochRewards.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set the target validator epoch payment', async () => {
      assertEqualBN(await epochRewards.targetValidatorEpochPayment(), targetValidatorEpochPayment)
    })

    it('should have set the target voting yield parameters', async () => {
      const [target, max, adjustmentFactor] = await epochRewards.getTargetVotingYieldParameters()
      assertEqualBN(target, targetVotingYieldParams.initial)
      assertEqualBN(max, targetVotingYieldParams.max)
      assertEqualBN(adjustmentFactor, targetVotingYieldParams.adjustmentFactor)
    })

    it('should have set the rewards multiplier parameters', async () => {
      const [max, underspend, overspend] = await epochRewards.getRewardsMultiplierParameters()
      assertEqualBN(max, rewardsMultiplier.max)
      assertEqualBN(underspend, rewardsMultiplier.adjustments.underspend)
      assertEqualBN(overspend, rewardsMultiplier.adjustments.overspend)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        epochRewards.initialize(
          registry.address,
          targetVotingYieldParams.initial,
          targetVotingYieldParams.max,
          targetVotingYieldParams.adjustmentFactor,
          rewardsMultiplier.max,
          rewardsMultiplier.adjustments.underspend,
          rewardsMultiplier.adjustments.overspend,
          targetVotingGoldFraction,
          targetValidatorEpochPayment,
          communityRewardFraction,
          carbonOffsettingPartner,
          carbonOffsettingFraction
        )
      )
    })
  })

  describe('#setTargetVotingGoldFraction()', () => {
    describe('when the fraction is different', () => {
      const newFraction = targetVotingGoldFraction.plus(1)

      describe('when called by the owner', () => {
        it('should set the target voting gold fraction', async () => {
          await epochRewards.setTargetVotingGoldFraction(newFraction)
          assertEqualBN(await epochRewards.getTargetVotingGoldFraction(), newFraction)
        })

        it('should emit the TargetVotingGoldFractionSet event', async () => {
          const resp = await epochRewards.setTargetVotingGoldFraction(newFraction)
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'TargetVotingGoldFractionSet',
            args: {
              fraction: newFraction,
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              epochRewards.setTargetVotingGoldFraction(newFraction, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the fraction is the same', () => {
        it('should revert', async () => {
          await assertRevert(epochRewards.setTargetVotingGoldFraction(targetVotingGoldFraction))
        })
      })
    })
  })

  describe('#setCommunityRewardFraction()', () => {
    describe('when the fraction is different', () => {
      const newFraction = communityRewardFraction.plus(1)

      describe('when called by the owner', () => {
        it('should set the community reward fraction', async () => {
          await epochRewards.setCommunityRewardFraction(newFraction)
          assertEqualBN(await epochRewards.getCommunityRewardFraction(), newFraction)
        })

        it('should emit the CommunityRewardFractionSet event', async () => {
          const resp = await epochRewards.setCommunityRewardFraction(newFraction)
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'CommunityRewardFractionSet',
            args: {
              fraction: newFraction,
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              epochRewards.setCommunityRewardFraction(newFraction, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the fraction is the same', () => {
        it('should revert', async () => {
          await assertRevert(epochRewards.setCommunityRewardFraction(communityRewardFraction))
        })
      })
    })
  })

  describe('#setTargetValidatorEpochPayment()', () => {
    describe('when the payment is different', () => {
      const newPayment = targetValidatorEpochPayment.plus(1)

      describe('when called by the owner', () => {
        it('should set the target validator epoch payment', async () => {
          await epochRewards.setTargetValidatorEpochPayment(newPayment)
          assertEqualBN(await epochRewards.targetValidatorEpochPayment(), newPayment)
        })

        it('should emit the TargetValidatorEpochPaymentSet event', async () => {
          const resp = await epochRewards.setTargetValidatorEpochPayment(newPayment)
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'TargetValidatorEpochPaymentSet',
            args: {
              payment: newPayment,
            },
          })
        })

        describe('when the payment is the same', () => {
          it('should revert', async () => {
            await assertRevert(
              epochRewards.setTargetValidatorEpochPayment(targetValidatorEpochPayment)
            )
          })
        })
      })

      describe('when called by a non-owner', () => {
        it('should revert', async () => {
          await assertRevert(
            epochRewards.setTargetValidatorEpochPayment(newPayment, {
              from: nonOwner,
            })
          )
        })
      })
    })
  })

  describe('#setRewardsMultiplierParameters()', () => {
    describe('when one of the parameters is different', () => {
      const newParams = {
        max: rewardsMultiplier.max,
        underspend: rewardsMultiplier.adjustments.underspend.plus(1),
        overspend: rewardsMultiplier.adjustments.overspend,
      }

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await epochRewards.setRewardsMultiplierParameters(
            newParams.max,
            newParams.underspend,
            newParams.overspend
          )
        })

        it('should set the new rewards multiplier adjustment params', async () => {
          const [max, underspend, overspend] = await epochRewards.getRewardsMultiplierParameters()
          assertEqualBN(max, newParams.max)
          assertEqualBN(underspend, newParams.underspend)
          assertEqualBN(overspend, newParams.overspend)
        })

        it('should emit the RewardsMultiplierParametersSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'RewardsMultiplierParametersSet',
            args: {
              max: newParams.max,
              underspendAdjustmentFactor: newParams.underspend,
              overspendAdjustmentFactor: newParams.overspend,
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              epochRewards.setRewardsMultiplierParameters(
                newParams.max,
                newParams.underspend,
                newParams.overspend,
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
            epochRewards.setRewardsMultiplierParameters(
              rewardsMultiplier.max,
              rewardsMultiplier.adjustments.underspend,
              rewardsMultiplier.adjustments.overspend
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

  describe('#setTargetVotingYield()', () => {
    const newTarget = targetVotingYieldParams.initial.plus(1)

    describe('when called by the owner', () => {
      let resp: any

      beforeEach(async () => {
        resp = await epochRewards.setTargetVotingYield(newTarget)
      })

      it('should set the new target voting yield', async () => {
        const [target, ,] = await epochRewards.getTargetVotingYieldParameters()
        assertEqualBN(target, newTarget)
      })

      it('should emit the TargetVotingYieldSet event', async () => {
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'TargetVotingYieldSet',
          args: {
            target: newTarget,
          },
        })
      })
    })

    describe('when called by a non-owner', () => {
      it('should revert', async () => {
        await assertRevert(
          epochRewards.setTargetVotingYield(newTarget, {
            from: nonOwner,
          })
        )
      })
    })
  })

  describe('#getTargetGoldTotalSupply()', () => {
    describe('when it has been fewer than 15 years since genesis', () => {
      const timeDelta: BigNumber = YEAR.times(10)
      beforeEach(async () => {
        await timeTravelToDelta(timeDelta)
      })

      it('should return 600MM + 200MM * t / 15', async () => {
        assertEqualDpBN(
          await epochRewards.getTargetGoldTotalSupply(),
          getExpectedTargetTotalSupply(timeDelta),
          8
        )
      })
    })
  })

  describe('#getTargetVoterRewards()', () => {
    describe('when there are active votes', () => {
      const activeVotes = 1000000
      beforeEach(async () => {
        await mockElection.setActiveVotes(activeVotes)
      })

      it('should return a percentage of the active votes', async () => {
        const expected = fromFixed(targetVotingYieldParams.initial).times(activeVotes)
        assertEqualBN(await epochRewards.getTargetVoterRewards(), expected)
      })
    })
  })

  describe('#getTargetTotalEpochPaymentsInGold()', () => {
    describe('when a StableToken exchange rate is set', () => {
      const numberValidators = 100
      beforeEach(async () => {
        await epochRewards.setNumberValidatorsInCurrentSet(numberValidators)
      })

      it('should return the number of validators times the max payment divided by the exchange rate', async () => {
        const expected = targetValidatorEpochPayment
          .times(numberValidators)
          .div(exchangeRate)
          .integerValue(BigNumber.ROUND_FLOOR)
        assertEqualBN(await epochRewards.getTargetTotalEpochPaymentsInGold(), expected)
      })
    })
  })

  describe('#getRewardsMultiplier()', () => {
    const timeDelta = YEAR.times(10)
    const expectedTargetTotalSupply = getExpectedTargetTotalSupply(timeDelta)
    const expectedTargetRemainingSupply = SUPPLY_CAP.minus(expectedTargetTotalSupply)
    let targetEpochReward: BigNumber
    beforeEach(async () => {
      targetEpochReward = await epochRewards.getTargetVoterRewards()
      targetEpochReward = targetEpochReward.plus(
        await epochRewards.getTargetTotalEpochPaymentsInGold()
      )
    })

    describe('when the target supply is equal to the actual supply after rewards', () => {
      beforeEach(async () => {
        await mockGoldToken.setTotalSupply(expectedTargetTotalSupply.minus(targetEpochReward))
        await timeTravelToDelta(timeDelta)
      })

      it('should return one', async () => {
        assertEqualBN(await epochRewards.getRewardsMultiplier(), toFixed(1))
      })
    })

    describe('when the actual remaining supply is 10% more than the target remaining supply after rewards', () => {
      beforeEach(async () => {
        const actualRemainingSupply = expectedTargetRemainingSupply.times(1.1)
        const totalSupply = SUPPLY_CAP.minus(actualRemainingSupply)
          .minus(targetEpochReward)
          .integerValue(BigNumber.ROUND_FLOOR)
        await mockGoldToken.setTotalSupply(totalSupply)
        await timeTravelToDelta(timeDelta)
      })

      it('should return one plus 10% times the underspend adjustment', async () => {
        const actual = fromFixed(await epochRewards.getRewardsMultiplier())
        const expected = new BigNumber(1).plus(
          fromFixed(rewardsMultiplier.adjustments.underspend).times(0.1)
        )
        // Assert equal to 8 decimal places due to fixidity imprecision.
        assertEqualDpBN(actual, expected, 8)
      })
    })

    describe('when the actual remaining supply is 10% less than the target remaining supply after rewards', () => {
      beforeEach(async () => {
        const actualRemainingSupply = expectedTargetRemainingSupply.times(0.9)
        const totalSupply = SUPPLY_CAP.minus(actualRemainingSupply)
          .minus(targetEpochReward)
          .integerValue(BigNumber.ROUND_FLOOR)
        await mockGoldToken.setTotalSupply(totalSupply)
        await timeTravelToDelta(timeDelta)
      })

      it('should return one minus 10% times the underspend adjustment', async () => {
        const actual = fromFixed(await epochRewards.getRewardsMultiplier())
        const expected = new BigNumber(1).minus(
          fromFixed(rewardsMultiplier.adjustments.overspend).times(0.1)
        )
        // Assert equal to 9 decimal places due to fixidity imprecision.
        assertEqualDpBN(actual, expected, 9)
      })
    })
  })

  describe('#updateTargetVotingYield()', () => {
    // Arbitrary numbers
    const totalSupply = new BigNumber(129762987346298761037469283746)
    const reserveBalance = new BigNumber(2397846127684712867321)
    const floatingSupply = totalSupply.minus(reserveBalance)
    let reserve: ReserveInstance

    beforeEach(async () => {
      reserve = await Reserve.new()
      await registry.setAddressFor(CeloContractName.Reserve, reserve.address)
      await reserve.initialize(
        registry.address,
        60,
        toFixed(1),
        0,
        0,
        initialAssetAllocationSymbols,
        initialAssetAllocationWeights,
        toFixed(0.005),
        toFixed(2)
      )
      await mockGoldToken.setTotalSupply(totalSupply)
      await web3.eth.sendTransaction({
        from: accounts[9],
        to: reserve.address,
        value: reserveBalance.toString(),
      })
    })

    describe('when the percentage of voting gold is equal to the target', () => {
      beforeEach(async () => {
        const totalVotes = floatingSupply
          .times(fromFixed(targetVotingGoldFraction))
          .integerValue(BigNumber.ROUND_FLOOR)
        await mockElection.setTotalVotes(totalVotes)
        await epochRewards.updateTargetVotingYield()
      })

      it('should not change the target voting yield', async () => {
        assertEqualBN(
          (await epochRewards.getTargetVotingYieldParameters())[0],
          targetVotingYieldParams.initial
        )
      })
    })

    describe('when the percentage of voting gold is 10% less than the target', () => {
      beforeEach(async () => {
        const totalVotes = floatingSupply
          .times(fromFixed(targetVotingGoldFraction).minus(0.1))
          .integerValue(BigNumber.ROUND_FLOOR)
        await mockElection.setTotalVotes(totalVotes)
        await epochRewards.updateTargetVotingYield()
      })

      it('should increase the target voting yield by 10% times the adjustment factor', async () => {
        const expected = fromFixed(
          targetVotingYieldParams.initial.plus(targetVotingYieldParams.adjustmentFactor.times(0.1))
        )
        const actual = fromFixed((await epochRewards.getTargetVotingYieldParameters())[0])
        // Assert equal to 9 decimal places due to fixidity imprecision.
        assert.equal(expected.dp(9).toFixed(), actual.dp(9).toFixed())
      })
    })

    describe('when the percentage of voting gold is 10% more than the target', () => {
      beforeEach(async () => {
        const totalVotes = floatingSupply
          .times(fromFixed(targetVotingGoldFraction).plus(0.1))
          .integerValue(BigNumber.ROUND_FLOOR)
        await mockElection.setTotalVotes(totalVotes)
        await epochRewards.updateTargetVotingYield()
      })

      it('should decrease the target voting yield by 10% times the adjustment factor', async () => {
        const expected = fromFixed(
          targetVotingYieldParams.initial.minus(targetVotingYieldParams.adjustmentFactor.times(0.1))
        )
        const actual = fromFixed((await epochRewards.getTargetVotingYieldParameters())[0])
        // Assert equal to 9 decimal places due to fixidity imprecision.
        assert.equal(expected.dp(9).toFixed(), actual.dp(9).toFixed())
      })
    })
  })

  describe('#calculateTargetEpochRewards()', () => {
    describe('when there are active votes, a stable token exchange rate is set and the actual remaining supply is 10% more than the target remaining supply after rewards', () => {
      const activeVotes = web3.utils.toWei('102398474')
      const timeDelta = YEAR.times(10)
      const numberValidators = 100
      let expectedMultiplier: BigNumber
      let expectedTargetGoldSupplyIncrease: BigNumber
      beforeEach(async () => {
        await epochRewards.setNumberValidatorsInCurrentSet(numberValidators)
        await mockElection.setActiveVotes(activeVotes)
        const expectedTargetTotalEpochPaymentsInGold = targetValidatorEpochPayment
          .times(numberValidators)
          .div(exchangeRate)
          .integerValue(BigNumber.ROUND_FLOOR)
        const expectedTargetEpochRewards = fromFixed(targetVotingYieldParams.initial).times(
          activeVotes
        )
        expectedTargetGoldSupplyIncrease = expectedTargetEpochRewards
          .plus(expectedTargetTotalEpochPaymentsInGold)
          .div(
            new BigNumber(1)
              .minus(fromFixed(communityRewardFraction))
              .minus(fromFixed(carbonOffsettingFraction))
          )
          .integerValue(BigNumber.ROUND_FLOOR)
        const expectedTargetTotalSupply = getExpectedTargetTotalSupply(timeDelta)
        const expectedTargetRemainingSupply = SUPPLY_CAP.minus(expectedTargetTotalSupply)
        const actualRemainingSupply = expectedTargetRemainingSupply.times(1.1)
        const totalSupply = SUPPLY_CAP.minus(actualRemainingSupply)
          .minus(expectedTargetGoldSupplyIncrease)
          .integerValue(BigNumber.ROUND_FLOOR)
        await mockGoldToken.setTotalSupply(totalSupply)
        expectedMultiplier = new BigNumber(1).plus(
          fromFixed(rewardsMultiplier.adjustments.underspend).times(0.1)
        )
        await timeTravelToDelta(timeDelta)
      })

      it('should fetch the expected rewards multiplier', async () => {
        assertEqualBN(await epochRewards.getRewardsMultiplier(), toFixed(expectedMultiplier))
      })

      it('should return the target validator epoch payment times the rewards multiplier', async () => {
        const expected = targetValidatorEpochPayment.times(expectedMultiplier)
        assertEqualBN((await epochRewards.calculateTargetEpochRewards())[0], expected)
      })

      it('should return the target yield times the number of active votes times the rewards multiplier', async () => {
        const expected = fromFixed(targetVotingYieldParams.initial)
          .times(activeVotes)
          .times(expectedMultiplier)
        assertEqualBN((await epochRewards.calculateTargetEpochRewards())[1], expected)
      })

      it('should return the correct amount for the community reward', async () => {
        const validatorReward = targetValidatorEpochPayment
          .times(numberValidators)
          .div(exchangeRate)
        const votingReward = fromFixed(targetVotingYieldParams.initial).times(activeVotes)
        const expected = validatorReward
          .plus(votingReward)
          .div(
            new BigNumber(1)
              .minus(fromFixed(communityRewardFraction))
              .minus(fromFixed(carbonOffsettingFraction))
          )
          .integerValue(BigNumber.ROUND_FLOOR)
          .times(fromFixed(communityRewardFraction))
          .times(expectedMultiplier)
          .integerValue(BigNumber.ROUND_FLOOR)
        assertAlmostEqualBN((await epochRewards.calculateTargetEpochRewards())[2], expected, 1)
      })

      it('should return the correct amount for the carbon offsetting fund', async () => {
        const validatorReward = targetValidatorEpochPayment
          .times(numberValidators)
          .div(exchangeRate)
        const votingReward = fromFixed(targetVotingYieldParams.initial).times(activeVotes)
        const expected = validatorReward
          .plus(votingReward)
          .div(
            new BigNumber(1)
              .minus(fromFixed(communityRewardFraction))
              .minus(fromFixed(carbonOffsettingFraction))
          )
          .integerValue(BigNumber.ROUND_FLOOR)
          .times(fromFixed(carbonOffsettingFraction))
          .times(expectedMultiplier)
          .integerValue(BigNumber.ROUND_FLOOR)
        assertAlmostEqualBN((await epochRewards.calculateTargetEpochRewards())[3], expected, 1)
      })
    })
  })

  describe('#isReserveLow', () => {
    // TODO: Add changing parameters in this test / don't hardcode the linear
    // ratio change.
    let reserve: ReserveInstance

    beforeEach(async () => {
      const totalSupply = new BigNumber(129762987346298761037469283746)
      reserve = await Reserve.new()
      await registry.setAddressFor(CeloContractName.Reserve, reserve.address)
      await reserve.initialize(
        registry.address,
        60,
        toFixed(1),
        0,
        0,
        initialAssetAllocationSymbols,
        initialAssetAllocationWeights,
        toFixed(0.005),
        toFixed(2)
      )
      await reserve.addToken(mockStableToken.address)
      await mockGoldToken.setTotalSupply(totalSupply)
      const assetAllocationSymbols = [
        web3.utils.padRight(web3.utils.utf8ToHex('cGLD'), 64),
        web3.utils.padRight(web3.utils.utf8ToHex('empty'), 64),
      ]
      const assetAllocationWeights = [
        new BigNumber(10)
          .pow(24)
          .dividedBy(new BigNumber(2))
          .integerValue(),
        new BigNumber(10)
          .pow(24)
          .dividedBy(new BigNumber(2))
          .integerValue(),
      ]
      await reserve.setAssetAllocations(assetAllocationSymbols, assetAllocationWeights)
    })

    describe('reserve ratio of 0.5', () => {
      beforeEach(async () => {
        const stableBalance = new BigNumber(2397846127684712867321)
        const goldBalance = stableBalance
          .div(exchangeRate)
          .div(2)
          .times(0.5)
          .integerValue()
        await mockStableToken.setTotalSupply(stableBalance)
        await web3.eth.sendTransaction({
          from: accounts[9],
          to: reserve.address,
          value: goldBalance.toString(),
        })
      })

      it('should be low at start', async () => {
        const timeDelta: BigNumber = YEAR.times(0)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, true)
      })

      it('should be low at 15 years', async () => {
        const timeDelta: BigNumber = YEAR.times(15)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, true)
      })

      it('should be low at 25 years', async () => {
        const timeDelta: BigNumber = YEAR.times(25)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, true)
      })
    })

    describe('reserve ratio of 1.5', () => {
      beforeEach(async () => {
        const stableBalance = new BigNumber(2397846127684712867321)
        const goldBalance = stableBalance
          .div(exchangeRate)
          .div(2)
          .times(1.5)
          .integerValue()
        await mockStableToken.setTotalSupply(stableBalance)
        await web3.eth.sendTransaction({
          from: accounts[9],
          to: reserve.address,
          value: goldBalance.toString(),
        })
      })

      it('should be low at start', async () => {
        const timeDelta: BigNumber = YEAR.times(0)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, true)
      })

      it('should be low at 12 years', async () => {
        const timeDelta: BigNumber = YEAR.times(12)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, true)
      })

      it('should not be low at 15 years', async () => {
        const timeDelta: BigNumber = YEAR.times(15)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, false)
      })

      it('should not be low at 25 years', async () => {
        const timeDelta: BigNumber = YEAR.times(25)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, false)
      })
    })

    describe('reserve ratio of 2.5', () => {
      beforeEach(async () => {
        const stableBalance = new BigNumber(2397846127684712867321)
        const goldBalance = stableBalance
          .div(exchangeRate)
          .div(2)
          .times(2.5)
          .integerValue()
        await mockStableToken.setTotalSupply(stableBalance)
        await web3.eth.sendTransaction({
          from: accounts[9],
          to: reserve.address,
          value: goldBalance.toString(),
        })
      })

      it('should not be low at start', async () => {
        const timeDelta: BigNumber = YEAR.times(0)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, false)
      })

      it('should not be low at 15 years', async () => {
        const timeDelta: BigNumber = YEAR.times(15)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, false)
      })

      it('should not be low at 25 years', async () => {
        const timeDelta: BigNumber = YEAR.times(25)
        await timeTravelToDelta(timeDelta)
        const isLow = await epochRewards.isReserveLow()
        assert.equal(isLow, false)
      })
    })
  })

  describe('when the contract is frozen', () => {
    beforeEach(async () => {
      await freezer.freeze(epochRewards.address)
    })

    it('should make calculateTargetEpochRewards revert', async () => {
      await assertRevert(epochRewards.calculateTargetEpochRewards())
    })

    it('should make updateTargetVotingYield revert', async () => {
      await assertRevert(epochRewards.updateTargetVotingYield())
    })
  })
})
