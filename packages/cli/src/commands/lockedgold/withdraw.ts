import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Withdraw extends BaseCommand {
  static description = 'Withdraw unlocked gold whose unlocking period has passed.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
  }

  static examples = ['withdraw']

  async run() {
    // tslint:disable-next-line
    const { flags, args } = this.parse(Withdraw)
    this.kit.defaultAccount = flags.from
    const lockedgold = await this.kit.contracts.getLockedGold()
    const pendingWithdrawals = await lockedgold.getPendingWithdrawals()
    const currentTime = Math.round(new Date().getTime() / 1000)
    let withdrawals = 0
    for (let i = 0; i < pendingWithdrawals.length; i++) {
      if (pendingWithdrawals[i].time <= currentTime) {
        await displaySendTx('withdraw', lockedgold.withdraw(i - withdrawals))
        withdrawals += 1
      }
    }
  }
}
