import { NULL_ADDRESS } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class WithdrawGold extends BaseCommand {
  static description = 'Withdraw unlocked gold whose unlocking period has passed.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Beneficiary of the vesting ' }),
  }

  static examples = ['withdraw-gold --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(WithdrawGold)
    this.kit.defaultAccount = flags.from
    const lockedgold = await this.kit.contracts.getLockedGold()
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingFactoryInstance = await vestingFactory.getVestedAt(flags.from)
    if (vestingFactoryInstance.address === NULL_ADDRESS) {
      console.error(`No vested instance found under the given beneficiary`)
      return
    }
    if ((await vestingFactoryInstance.getBeneficiary()) !== flags.from) {
      console.error(`Vested instance has a different beneficiary`)
      return
    }

    await newCheckBuilder(this)
      .isAccount(vestingFactoryInstance.address)
      .runChecks()

    await newCheckBuilder(this)
      .isAccount(flags.from)
      .runChecks()

    const currentTime = Math.round(new Date().getTime() / 1000)
    while (true) {
      let madeWithdrawal = false
      const pendingWithdrawals = await lockedgold.getPendingWithdrawals(
        vestingFactoryInstance.address
      )
      for (let i = 0; i < pendingWithdrawals.length; i++) {
        const pendingWithdrawal = pendingWithdrawals[i]
        if (pendingWithdrawal.time.isLessThan(currentTime)) {
          console.log(
            `Found available pending withdrawal of value ${pendingWithdrawal.value.toString()}, withdrawing`
          )
          await displaySendTx('withdrawLockedGoldTx', vestingFactoryInstance.withdrawLockedGold(i))
          madeWithdrawal = true
          break
        }
      }
      if (!madeWithdrawal) {
        break
      }
    }
    const remainingPendingWithdrawals = await lockedgold.getPendingWithdrawals(
      vestingFactoryInstance.address
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
