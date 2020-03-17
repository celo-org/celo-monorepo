import { EpochRewards } from '../generated/EpochRewards'
import { BaseWrapper, proxyCall } from './BaseWrapper'

/**
 * Contract for handling reserve for stable currencies
 */
export class EpochRewardsWrapper extends BaseWrapper<EpochRewards> {
  getRewardsMultiplier = proxyCall(this.contract.methods.getRewardsMultiplier)

  getTargetGoldTotalSupply = proxyCall(this.contract.methods.getTargetGoldTotalSupply)
}
