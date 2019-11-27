import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class GetInstance extends BaseCommand {
  static description = 'Get vesting instance contract address by beneficiary.'

  static flags = {
    ...BaseCommand.flags,
    beneficiary: Flags.address({ required: true }),
  }

  static examples = ['getinstance --beneficiary 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(GetInstance)
    this.kit.defaultAccount = flags.beneficiary
    const lockedgold = await this.kit.contracts.getLockedGold()

    await newCheckBuilder(this)
      .isAccount(flags.beneficiary)
      .runChecks()

    const currentTime = Math.round(new Date().getTime() / 1000)
    while (true) {
      let madeWithdrawal = false
      const pendingWithdrawals = await lockedgold.getPendingWithdrawals(flags.beneficiary)
      for (let i = 0; i < pendingWithdrawals.length; i++) {
        const pendingWithdrawal = pendingWithdrawals[i]
        if (pendingWithdrawal.time.isLessThan(currentTime)) {
          console.log(
            `Found available pending withdrawal of value ${pendingWithdrawal.value.toString()}, withdrawing`
          )
          await displaySendTx('withdraw', lockedgold.withdraw(i))
          madeWithdrawal = true
          break
        }
      }
      if (!madeWithdrawal) {
        break
      }
    }
    const remainingPendingWithdrawals = await lockedgold.getPendingWithdrawals(flags.beneficiary)
    for (const pendingWithdrawal of remainingPendingWithdrawals) {
      console.log(
        `Pending withdrawal of value ${pendingWithdrawal.value.toString()} available for withdrawal in ${pendingWithdrawal.time
          .minus(currentTime)
          .toString()} seconds.`
      )
    }
  }
}
