import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Withdraw extends BaseCommand {
  static description = 'Withdraw unlocked gold whose unlocking period has passed.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
  }

  static examples = ['withdraw --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Withdraw)
    this.kit.defaultAccount = flags.from
    const lockedgold = await this.kit.contracts.getLockedGold()
    const pendingWithdrawals = await lockedgold.getPendingWithdrawals(flags.from)
    const currentTime = Math.round(new Date().getTime() / 1000)
    let withdrawals = 0
    for (let i = 0; i < pendingWithdrawals.length; i++) {
      if (pendingWithdrawals[i].time.isLessThan(currentTime)) {
        await displaySendTx('withdraw', lockedgold.withdraw(i - withdrawals))
        withdrawals += 1
      }
    }
  }
}
