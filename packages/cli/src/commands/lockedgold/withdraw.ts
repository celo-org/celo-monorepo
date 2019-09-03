import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Withdraw extends BaseCommand {
  static description = 'Withdraw notified commitment given availability time'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
  }

  static args = [{ ...LockedGoldArgs.availabilityTimeArg, required: true }]

  static examples = ['withdraw 3600']

  async run() {
    // tslint:disable-next-line
    const { flags, args } = this.parse(Withdraw)
    this.kit.defaultAccount = flags.from
    const lockedgold = await this.kit.contracts.getLockedGold()
    await displaySendTx('withdrawCommitment', lockedgold.withdrawCommitment(args.availabilityTime))
  }
}
