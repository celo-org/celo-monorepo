import { printValueMapRecursive } from '../../utils/cli'
import { ReleaseGoldBaseCommand } from '../../utils/release-gold-base'

export default class Show extends ReleaseGoldBaseCommand {
  static description = 'Show info on a ReleaseGold instance contract.'

  static flags = {
    ...ReleaseGoldBaseCommand.flags,
  }

  static examples = ['show --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    const balanceStateData = {
      totalWithdrawn: await this.releaseGoldWrapper.getTotalWithdrawn(),
      maxDistribution: await this.releaseGoldWrapper.getMaxDistribution(),
      totalBalance: await this.releaseGoldWrapper.getTotalBalance(),
      remainingTotalBalance: await this.releaseGoldWrapper.getRemainingTotalBalance(),
      remainingUnlockedBalance: await this.releaseGoldWrapper.getRemainingUnlockedBalance(),
      remainingLockedBalance: await this.releaseGoldWrapper.getRemainingLockedBalance(),
      currentReleasedTotalAmount: await this.releaseGoldWrapper.getCurrentReleasedTotalAmount(),
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
      releaseSchedule: await this.releaseGoldWrapper.getHumanReadableReleaseSchedule(),
      isRevoked: await this.releaseGoldWrapper.isRevoked(),
      revokedStateData: await this.releaseGoldWrapper.getRevocationInfo(),
      balanceStateData: balanceStateData,
    }
    printValueMapRecursive(releaseGoldInfo)
  }
}
