import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Notify extends BaseCommand {
  static description = 'Notify a Locked Gold commitment given notice period and gold amount'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    noticePeriod: flags.string({ ...LockedGoldArgs.noticePeriodArg, required: true }),
    goldAmount: flags.string({ ...LockedGoldArgs.goldAmountArg, required: true }),
  }

  static args = []

  static examples = ['notify --noticePeriod=3600 --goldAmount=500']

  async run() {
    const res = this.parse(Notify)
    this.kit.defaultAccount = res.flags.from
    const lockedgold = await this.kit.contracts.getLockedGold()
    await displaySendTx(
      'notifyCommitment',
      lockedgold.notifyCommitment(res.flags.goldAmount, res.flags.noticePeriod)
    )
  }
}
