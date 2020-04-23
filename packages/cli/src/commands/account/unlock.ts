import { flags } from '@oclif/command'
import { IArg } from '@oclif/parser/lib/args'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'

export default class Unlock extends BaseCommand {
  static description = 'Unlock an account address to send transactions or validate blocks'

  static flags = {
    ...BaseCommand.flags,
    password: flags.string({ required: false }),
  }

  static args: IArg[] = [Args.address('account', { description: 'Account address' })]

  static examples = ['unlock 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  requireSynced = false

  async run() {
    const res = this.parse(Unlock)
    if (res.flags.useLedger) {
      console.log('Warning: account:unlock not implemented for Ledger')
    }
    // Unlock until geth exits
    // Source: https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_unlockaccount
    const unlockDurationInMs = 0
    const password =
      res.flags.password || (await cli.prompt('Password', { type: 'hide', required: false }))

    await this.web3.eth.personal.unlockAccount(res.args.account, password, unlockDurationInMs)
  }
}
