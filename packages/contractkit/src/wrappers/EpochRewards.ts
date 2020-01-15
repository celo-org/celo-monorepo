import BigNumber from 'bignumber.js'
import { EpochRewards } from '../generated/types/EpochRewards'
import { BaseWrapper, proxyCall, valueToBigNumber } from './BaseWrapper'

/**
 * Contract for calculating epoch rewards.
 */
export class EpochRewardsWrapper extends BaseWrapper<EpochRewards> {
  frozen = proxyCall(this.contract.methods.frozen)

  /**
   * Returns the target voting Gold fraction.
   * @return The percentage of floating Gold voting to target.
   */
  getTargetVotingGoldFraction = proxyCall(
    this.contract.methods.getTargetVotingGoldFraction,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the fraction of floating Gold being used for voting in validator elections.
   * @return The fraction of floating Gold being used for voting in validator elections.
   */
  getVotingGoldFraction = proxyCall(
    this.contract.methods.getVotingGoldFraction,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the target voting yield parameters.
   * @return The target, max, and adjustment factor for target voting yield.
   */
  getTargetVotingYieldParameters = proxyCall(
    this.contract.methods.getTargetVotingYieldParameters,
    undefined,
    (
      res
    ): {
      target: BigNumber
      max: BigNumber
      adjustmentFactor: BigNumber
    } => ({
      target: valueToBigNumber(res[0]),
      max: valueToBigNumber(res[1]),
      adjustmentFactor: valueToBigNumber(res[2]),
    })
  )

  /**
   * Returns the total target epoch rewards for voters.
   * @return the total target epoch rewards for voters.
   */
  getTargetEpochRewards = proxyCall(
    this.contract.methods.getTargetEpochRewards,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the total target epoch payments to validators, converted to Gold.
   * @return The total target epoch payments to validators, converted to Gold.
   */
  getTargetTotalEpochPaymentsInGold = proxyCall(
    this.contract.methods.getTargetTotalEpochPaymentsInGold,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the rewards multiplier based on the current and target Gold supplies.
   * @return The rewards multiplier based on the current and target Gold supplies.
   */
  getRewardsMultiplier = proxyCall(
    this.contract.methods.getRewardsMultiplier,
    undefined,
    valueToBigNumber
  )
}
