import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { ReleaseGoldCommand } from './release-gold'

export default class Revoke extends ReleaseGoldCommand {
  static description =
    'Revoke the given contract instance. Once revoked, any Locked Gold can be unlocked by the release owner. The beneficiary will then be able to withdraw any released Gold that had yet to be withdrawn, and the remainder can be transferred by the release owner to the refund address. Note that not all ReleaseGold instances are revokable.'

  static args = []

  static examples = ['revoke --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    const isRevocable = await this.releaseGoldWrapper.isRevocable()

    await newCheckBuilder(this)
      .addCheck('Contract is not revoked', () => !isRevoked)
      .addCheck('Contract is revocable', () => isRevocable)
      .runChecks()

    this.kit.defaultAccount = await this.releaseGoldWrapper.getReleaseOwner()
    await displaySendTx('revokeReleasing', await this.releaseGoldWrapper.revokeReleasing())
  }
}
