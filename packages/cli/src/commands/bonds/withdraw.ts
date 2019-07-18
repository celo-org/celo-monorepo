import { BaseCommand } from '../../base'
import { BondedDeposits } from '../../generated/contracts'
import { BondArgs } from '../../utils/bonds'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Withdraw extends BaseCommand {
  static description = 'Withdraw notified deposit given availability time'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
  }

  static args = [{ ...BondArgs.availabilityTimeArg, required: true }]

  static examples = ['withdraw 3600']

  async run() {
    // tslint:disable-next-line
    const { flags, args } = this.parse(Withdraw)
    const bondsContract = await BondedDeposits(this.web3, flags.from)
    await displaySendTx('withdraw', bondsContract.methods.withdraw(args.availabilityTime))
  }
}
