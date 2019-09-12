import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { requireNodeIsSynced } from '../../utils/helpers'

export default class Register extends BaseCommand {
  static description = 'Register an account for Locked Gold'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
  }

  static args = []

  static examples = ['register']

  async run() {
    await requireNodeIsSynced(this.web3)
    const res = this.parse(Register)
    this.kit.defaultAccount = res.flags.from
    const lockedGold = await this.kit.contracts.getLockedGold()
    await displaySendTx('register', lockedGold.createAccount())
  }
}
