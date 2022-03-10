import { CeloContract } from '../base'
import { WrapperCache } from '../contract-cache'
// import { AccountsWrapper } from '../wrappers/Accounts'
import { ElectionWrapper } from '../wrappers/Election'
// import { EpochRewardsWrapper } from '../wrappers/EpochRewards'
// import { GovernanceWrapper } from '../wrappers/Governance'
// import { LockedGoldWrapper } from '../wrappers/LockedGold'
import { ValidatorsWrapper } from '../wrappers/Validators'

// const Wrappers = {
//   [CeloContract.Accounts]:AccountsWrapper,
//   [CeloContract.Election]: ElectionWrapper,
//   [CeloContract.Governance]: GovernanceWrapper,
//   [CeloContract.LockedGold]: LockedGoldWrapper,
//   [CeloContract.Validators]: ValidatorsWrapper,
//   [CeloContract.EpochRewards]: EpochRewardsWrapper,
//   [CeloContract.DowntimeSlasher]: EpochRewardsWrapper
// }

export default class VoteSet extends WrapperCache {
  getAccounts() {
    return this.getContract(CeloContract.Accounts)
  }

  getElection() {
    return this.getContract(CeloContract.Election) as Promise<ElectionWrapper>
  }
  getEpochRewards() {
    return this.getContract(CeloContract.EpochRewards)
  }

  getGovernance() {
    return this.getContract(CeloContract.Governance)
  }

  getLockedGold() {
    return this.getContract(CeloContract.LockedGold)
  }

  getValidators() {
    return this.getContract(CeloContract.Validators) as Promise<ValidatorsWrapper>
  }

  getDoubleSigningSlasher() {
    return this.getContract(CeloContract.DoubleSigningSlasher)
  }
  getDowntimeSlasher() {
    return this.getContract(CeloContract.DowntimeSlasher)
  }
}
