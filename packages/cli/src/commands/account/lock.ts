import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'

export default class Lock extends BaseCommand {
  static description = 'Lock an account which was previously unlocked'

  static flags = BaseCommand.flagsWithoutLocalAddresses()

  static args: IArg[] = [Args.address('account', { description: 'Account address' })]

  static examples = ['lock 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  requireSynced = false

  async run() {
    const res = this.parse(Lock)
    if (res.flags.useLedger) {
      console.warn('Warning: account:lock not implemented for Ledger')
    }

    await this.web3.eth.personal.lockAccount(res.args.account)
  }
}
