import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { ReleaseGoldCommand } from './release-gold'
export default class CreateAccount extends ReleaseGoldCommand {
  static description = 'Creates a new account for the ReleaseGold instance'

  static flags = {
    ...ReleaseGoldCommand.flags,
  }

  static args = []

  static examples = ['create-account --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    await newCheckBuilder(this)
      .isNotAccount(this.releaseGoldWrapper.address)
      .addCheck('Contract is not revoked', () => !isRevoked)
      .runChecks()

    this.kit.defaultAccount = await this.releaseGoldWrapper.getBeneficiary()
    await displaySendTx('createAccount', this.releaseGoldWrapper.createAccount())
  }
}
