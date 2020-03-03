import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class RefundAndFinalize extends BaseCommand {
  static description =
    "Refund the given contract's balance to the appopriate parties and destroy the contact"

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
  }

  static args = []

  static examples = ['refund-and-finalize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(RefundAndFinalize)
    const contractAddress = flags.contract
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )
    const isRevoked = await releaseGoldWrapper.isRevoked()
    const remainingLockedBalance = await releaseGoldWrapper.getRemainingLockedBalance()

    await newCheckBuilder(this)
      .addCheck('Contract is revoked', () => isRevoked)
      .addCheck('All contract gold is unlocked', () => remainingLockedBalance.eq(0))
      .runChecks()

    this.kit.defaultAccount = await releaseGoldWrapper.getReleaseOwner()
    await displaySendTx('refundAndFinalize', await releaseGoldWrapper.refundAndFinalize())
  }
}
