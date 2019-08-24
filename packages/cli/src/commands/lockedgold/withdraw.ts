import { LockedGold } from '@celo/walletkit'
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
    const lockedGoldContract = await LockedGold(this.web3, flags.from)
    await displaySendTx(
      'withdraw',
      lockedGoldContract.methods.withdrawCommitment(args.availabilityTime)
    )
  }
}
