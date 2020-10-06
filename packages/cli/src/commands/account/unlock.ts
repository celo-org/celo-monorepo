import { flags } from '@oclif/command'
import { IArg } from '@oclif/parser/lib/args'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'

export default class Unlock extends BaseCommand {
  static description = 'Unlock an account address to send transactions or validate blocks'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    password: flags.string({
      required: false,
      description:
        'Password used to unlock the account. If not specified, you will be prompted for a password.',
    }),
    duration: flags.integer({
      required: false,
      default: 0,
      description:
        'Duration in seconds to leave the account unlocked. Unlocks until the node exits by default.',
    }),
  }

  static args: IArg[] = [Args.address('account', { description: 'Account address' })]

  static examples = [
    'unlock 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'unlock 0x5409ed021d9299bf6814279a6a1411a7e866a631 --duration 600',
  ]

  requireSynced = false

  async run() {
    const res = this.parse(Unlock)
    if (res.flags.useLedger) {
      console.warn('Warning: account:unlock not implemented for Ledger')
    }

    const password =
      res.flags.password || (await cli.prompt('Password', { type: 'hide', required: false }))
    await this.web3.eth.personal.unlockAccount(res.args.account, password, res.flags.duration)
  }
}
