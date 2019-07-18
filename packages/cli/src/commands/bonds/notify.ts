import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { BondedDeposits } from '../../generated/contracts'
import { BondArgs } from '../../utils/bonds'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Notify extends BaseCommand {
  static description = 'Notify a bonded deposit given notice period and gold amount'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    noticePeriod: flags.string({ ...BondArgs.noticePeriodArg, required: true }),
    goldAmount: flags.string({ ...BondArgs.goldAmountArg, required: true }),
  }

  static args = []

  static examples = ['notify --noticePeriod=3600 --goldAmount=500']

  async run() {
    const res = this.parse(Notify)
    const bondedDeposits = await BondedDeposits(this.web3, res.flags.from)
    await displaySendTx(
      'notify',
      bondedDeposits.methods.notify(res.flags.goldAmount, res.flags.noticePeriod)
    )
  }
}
