import { NULL_ADDRESS } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class WithdrawGold extends BaseCommand {
  static description =
    'Withdraw any pending withdrawals created via "vesting:unlock-gold" that have become available through the vesting instance.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
  }

  static examples = ['withdraw-gold --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(WithdrawGold)
    this.kit.defaultAccount = flags.from
    const lockedgold = await this.kit.contracts.getLockedGold()
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(flags.from)

    await newCheckBuilder(this)
      .addCheck(
        `No vested instance found under the given beneficiary ${flags.from}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vested instance has a different beneficiary`,
        async () => (await vestingInstance.getBeneficiary()) === flags.from
      )
      .runChecks()

    const currentTime = Math.round(new Date().getTime() / 1000)
    while (true) {
      let madeWithdrawal = false
      const pendingWithdrawals = await lockedgold.getPendingWithdrawals(vestingInstance.address)
      for (let i = 0; i < pendingWithdrawals.length; i++) {
        const pendingWithdrawal = pendingWithdrawals[i]
        if (pendingWithdrawal.time.isLessThan(currentTime)) {
          console.log(
            `Found available pending withdrawal of value ${pendingWithdrawal.value.toString()}, withdrawing`
          )
          await displaySendTx('withdrawLockedGoldTx', vestingInstance.withdrawLockedGold(i), {
            from: await vestingInstance.getBeneficiary(),
          })
          madeWithdrawal = true
          break
        }
      }
      if (!madeWithdrawal) {
        break
      }
    }
    const remainingPendingWithdrawals = await lockedgold.getPendingWithdrawals(
      vestingInstance.address
    )
    for (const pendingWithdrawal of remainingPendingWithdrawals) {
      console.log(
        `Pending withdrawal of value ${pendingWithdrawal.value.toString()} available for withdrawal in ${pendingWithdrawal.time
          .minus(currentTime)
          .toString()} seconds.`
      )
    }
  }
}
