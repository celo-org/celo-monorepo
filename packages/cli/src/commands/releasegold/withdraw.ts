import { newReleaseGold } from '@celo/contractkit/src/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/src/wrappers/ReleaseGold'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Withdraw extends BaseCommand {
  static description =
    'Withdraws `value` released gold to the beneficiary address. Fails if `value` worth of gold has not been released yet.'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
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
    const contractAddress = flags.contract
    const value = flags.value
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )

    const remainingUnlockedBalance = await releaseGoldWrapper.getRemainingUnlockedBalance()
    const maxDistribution = await releaseGoldWrapper.getMaxDistribution()
    const totalWithdrawn = await releaseGoldWrapper.getTotalWithdrawn()
    await newCheckBuilder(this)
      .addCheck('Value does not exceed available unlocked gold', () =>
        value.lte(remainingUnlockedBalance)
      )
      .addCheck('Value would not exceed maximum distribution', () =>
        value.plus(totalWithdrawn).lte(maxDistribution)
      )
      .addCheck('Contract has met liquidity provision if applicable', () =>
        releaseGoldWrapper.getLiquidityProvisionMet()
      )
      .runChecks()

    this.kit.defaultAccount = await releaseGoldWrapper.getBeneficiary()
    await displaySendTx('withdrawTx', await releaseGoldWrapper.withdraw(value.toNumber()))
  }
}
