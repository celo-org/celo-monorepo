import { fromFixed } from '@celo/utils/lib/fixidity'
import { EpochRewards } from '../generated/EpochRewards'
import { BaseWrapper, proxyCall, valueToBigNumber } from './BaseWrapper'

const parseFixidity = (v: string) => fromFixed(valueToBigNumber(v))

export class EpochRewardsWrapper extends BaseWrapper<EpochRewards> {
  getRewardsMultiplierParameters = proxyCall(
    this.contract.methods.getRewardsMultiplierParameters,
    undefined,
    (res) => ({
      max: parseFixidity(res[0]),
      underspendAdjustment: parseFixidity(res[1]),
      overspendAdjustment: parseFixidity(res[2]),
    })
  )

  getTargetVotingYieldParameters = proxyCall(
    this.contract.methods.getTargetVotingYieldParameters,
    undefined,
    (res) => ({
      target: parseFixidity(res[0]),
      max: parseFixidity(res[1]),
      adjustment: parseFixidity(res[2]),
    })
  )

  getCommunityReward = proxyCall(
    this.contract.methods.getCommunityRewardFraction,
    undefined,
    parseFixidity
  )

  getCarbonOffsetting = async () => {
    const factor = parseFixidity(await this.contract.methods.getCarbonOffsettingFraction().call())
    const partner = await this.contract.methods.carbonOffsettingPartner().call()
    return {
      factor,
      partner,
    }
  }

  getTargetValidatorEpochPayment = proxyCall(
    this.contract.methods.targetValidatorEpochPayment,
    undefined,
    valueToBigNumber
  )

  async getConfig() {
    const rewardsMultiplier = await this.getRewardsMultiplierParameters()
    const carbonOffsetting = await this.getCarbonOffsetting()
    const communityReward = await this.getCommunityReward()
    const targetVotingYield = await this.getTargetVotingYieldParameters()
    const targetValidatorEpochPayment = await this.getTargetValidatorEpochPayment()
    return {
      rewardsMultiplier,
      carbonOffsetting,
      communityReward,
      targetVotingYield,
      targetValidatorEpochPayment,
    }
  }
}

export type EpochRewardsWrapperType = EpochRewardsWrapper
