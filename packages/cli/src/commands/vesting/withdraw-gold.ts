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
    revoker: Flags.address({ required: true, description: 'Revoker of the vesting' }),
  }

  static examples = [
    'withdraw-gold --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --revoker 0x5409ED021D9299bf6814279A6A1411A7e866A631',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(WithdrawGold)
    const beneficiary = flags.from
    const revoker = flags.revoker
    const lockedgold = await this.kit.contracts.getLockedGold()
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(beneficiary)

    await newCheckBuilder(this)
      .addCheck(
        `No vesting instance found under the given beneficiary ${beneficiary}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vesting instance has a different beneficiary`,
        async () => (await vestingInstance.getBeneficiary()) === beneficiary
      )
      .addCheck(
        `Vesting instance has a different revoker`,
        async () => (await vestingInstance.getRevoker()) === revoker
      )
      .runChecks()

    const isRevoked = await vestingInstance.isRevoked()
    this.kit.defaultAccount = isRevoked ? revoker : beneficiary

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
            from: isRevoked ? revoker : beneficiary,
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
