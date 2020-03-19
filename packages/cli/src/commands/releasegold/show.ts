import { BalanceState, ReleaseGoldInfo } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { printValueMapRecursive } from '../../utils/cli'
import { ReleaseGoldCommand } from './release-gold'

export default class Show extends ReleaseGoldCommand {
  static description = 'Show info on a ReleaseGold instance contract.'

  static flags = {
    ...ReleaseGoldCommand.flags,
  }

  static examples = ['show --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    const balanceStateData: BalanceState = {
      totalWithdrawn: (await this.releaseGoldWrapper.getTotalWithdrawn()).toString(),
      maxDistribution: (await this.releaseGoldWrapper.getMaxDistribution()).toString(),
      totalBalance: (await this.releaseGoldWrapper.getTotalBalance()).toString(),
      remainingTotalBalance: (await this.releaseGoldWrapper.getRemainingTotalBalance()).toString(),
      remainingUnlockedBalance: (
        await this.releaseGoldWrapper.getRemainingUnlockedBalance()
      ).toString(),
      remainingLockedBalance: (
        await this.releaseGoldWrapper.getRemainingLockedBalance()
      ).toString(),
      currentReleasedTotalAmount: (
        await this.releaseGoldWrapper.getCurrentReleasedTotalAmount()
      ).toString(),
    }
    const releaseGoldInfo: ReleaseGoldInfo = {
      releaseGoldWrapperAddress: this.releaseGoldWrapper.address,
      beneficiary: await this.releaseGoldWrapper.getBeneficiary(),
      releaseOwner: await this.releaseGoldWrapper.getReleaseOwner(),
      refundAddress: await this.releaseGoldWrapper.getRefundAddress(),
      liquidityProvisionMet: await this.releaseGoldWrapper.getLiquidityProvisionMet(),
      canValidate: await this.releaseGoldWrapper.getCanValidate(),
      canVote: await this.releaseGoldWrapper.getCanVote(),
      releaseSchedule: await this.releaseGoldWrapper.getReleaseSchedule(),
      isRevoked: await this.releaseGoldWrapper.isRevoked(),
      revokedStateData: await this.releaseGoldWrapper.getRevocationInfo(),
      balanceStateData: balanceStateData,
    }
    printValueMapRecursive(releaseGoldInfo)
  }
}
