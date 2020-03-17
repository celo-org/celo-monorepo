import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldCommand } from './release-gold'

export default class SetBeneficiary extends ReleaseGoldCommand {
  static description = 'Set the beneficiary of the ReleaseGold contract'

  static flags = {
    ...ReleaseGoldCommand.flags,
    newBeneficiary: Flags.address({
      required: true,
      description: 'Address of the new beneficiary',
    }),
  }

  static args = []

  static examples = [
    'set-beneficiary --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --new-beneficiary 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(SetBeneficiary)
    const newBeneficiary = flags.newBeneficiary
    const owner = await this.releaseGoldWrapper.getOwner()

    this.kit.defaultAccount = owner
    const tx = this.releaseGoldWrapper.setBeneficiary(newBeneficiary)
    await displaySendTx('setBeneficiary', tx)
  }
}
