import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'

export default class Unlock extends BaseCommand {
  static description = 'Unlock an account address to send transactions or validate blocks'

  static flags = {
    ...BaseCommand.flags,
    account: Flags.address({ required: true }),
    password: flags.string({ required: true }),
  }

  static examples = ['unlock --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --password 1234']

  async run() {
    const res = this.parse(Unlock)
    this.web3.eth.personal.unlockAccount(res.flags.account, res.flags.password, 604800)
  }
}
