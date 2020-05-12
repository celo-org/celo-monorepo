import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { ReleaseGoldCommand } from './release-gold'

export default class RefundAndFinalize extends ReleaseGoldCommand {
  static description =
    "Refund the given contract's balance to the appopriate parties and destroy the contact. Can only be called by the release owner of revocable ReleaseGold instances."

  static flags = {
    ...ReleaseGoldCommand.flags,
  }

  static args = []

  static examples = ['refund-and-finalize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    const remainingLockedBalance = await this.releaseGoldWrapper.getRemainingLockedBalance()

    await newCheckBuilder(this)
      .addCheck('Contract is revoked', () => isRevoked)
      .addCheck('All contract gold is unlocked', () => remainingLockedBalance.eq(0))
      .runChecks()

    this.kit.defaultAccount = await this.releaseGoldWrapper.getReleaseOwner()
    await displaySendTx('refundAndFinalize', await this.releaseGoldWrapper.refundAndFinalize())
  }
}
