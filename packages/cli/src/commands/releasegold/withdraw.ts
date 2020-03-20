import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldCommand } from './release-gold'

export default class Withdraw extends ReleaseGoldCommand {
  static description =
    'Withdraws `value` released gold to the beneficiary address. Fails if `value` worth of gold has not been released yet.'

  static flags = {
    ...ReleaseGoldCommand.flags,
    value: Flags.wei({
      required: true,
      description: 'Amount of released gold (in wei) to withdraw',
    }),
  }

  static args = []

  static examples = [
    'withdraw --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --value 10000000000000000000000',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Withdraw)
    const value = flags.value

    const remainingUnlockedBalance = await this.releaseGoldWrapper.getRemainingUnlockedBalance()
    const maxDistribution = await this.releaseGoldWrapper.getMaxDistribution()
    const totalWithdrawn = await this.releaseGoldWrapper.getTotalWithdrawn()
    await newCheckBuilder(this)
      .addCheck('Value does not exceed available unlocked gold', () =>
        value.lte(remainingUnlockedBalance)
      )
      .addCheck('Value would not exceed maximum distribution', () =>
        value.plus(totalWithdrawn).lte(maxDistribution)
      )
      .addCheck('Contract has met liquidity provision if applicable', () =>
        this.releaseGoldWrapper.getLiquidityProvisionMet()
      )
      .runChecks()

    this.kit.defaultAccount = await this.releaseGoldWrapper.getBeneficiary()
    await displaySendTx('withdrawTx', this.releaseGoldWrapper.withdraw(value.toNumber()))
  }
}
