import { LockedGold } from '@celo/walletkit'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Register extends BaseCommand {
  static description = 'Register an account for Locked Gold'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
  }

  static args = []

  static examples = ['register']

  async run() {
    const res = this.parse(Register)
    const lockedGold = await LockedGold(this.web3, res.flags.from)
    const tx = lockedGold.methods.createAccount()
    await displaySendTx('register', tx)
  }
}
