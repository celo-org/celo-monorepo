import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Register extends BaseCommand {
  static description = 'Register an account'

  static flags = {
    ...BaseCommand.flags,
    name: flags.string(),
    from: Flags.address({ required: true }),
  }

  static args = []

  static examples = [
    'register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account',
  ]

  async run() {
    const res = this.parse(Register)
    this.kit.defaultAccount = res.flags.from
    const accounts = await this.kit.contracts.getAccounts()

    await newCheckBuilder(this)
      .isNotAccount(res.flags.from)
      .runChecks()
    await displaySendTx('register', accounts.createAccount())
    if (res.flags.name) {
      await displaySendTx('setName', accounts.setName(res.flags.name))
    }
  }
}
