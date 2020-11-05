import { BalanceState } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { ReleaseGoldBaseCommand } from '../../release-gold-base'
import { printValueMapRecursive } from '../../utils/cli'

export default class Show extends ReleaseGoldBaseCommand {
  static description = 'Show info on a ReleaseGold instance contract.'

  static flags = {
    ...ReleaseGoldBaseCommand.flags,
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
    const accounts = await this.kit.contracts.getAccounts()
    const authorizedSigners = {
      voter: await accounts.getVoteSigner(this.releaseGoldWrapper.address),
      validator: await accounts.getValidatorSigner(this.releaseGoldWrapper.address),
      attestations: await accounts.getAttestationSigner(this.releaseGoldWrapper.address),
    }
    const releaseGoldInfo = {
      releaseGoldWrapperAddress: this.releaseGoldWrapper.address,
      beneficiary: await this.releaseGoldWrapper.getBeneficiary(),
      authorizedSigners,
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
