import { Address } from '@celo/connect'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class DelegateInfo extends BaseCommand {
  static description = 'Delegate info about account.'

  static flags = {
    ...BaseCommand.flags,
    account: flags.string({ ...Flags.address, required: true }),
  }

  static args = []

  static examples = ['delegate-info --account 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    const res = this.parse(DelegateInfo)
    const address: Address = res.flags.account

    const lockedGold = await this.kit.contracts.getLockedGold()
    const delegateInfo = await lockedGold.getDelegateInfo(address)

    printValueMapRecursive(delegateInfo)
  }
}
