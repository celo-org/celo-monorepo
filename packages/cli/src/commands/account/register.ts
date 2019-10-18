import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Register extends BaseCommand {
  static description = 'Register an account'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
  }

  static args = []

  static examples = ['register']

  async run() {
    const res = this.parse(Register)
    this.kit.defaultAccount = res.flags.from
    const accounts = await this.kit.contracts.getAccounts()
    await displaySendTx('register', accounts.createAccount())
  }
}
