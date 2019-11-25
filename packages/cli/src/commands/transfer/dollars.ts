import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class DollarTransfer extends BaseCommand {
  static description = 'Transfer Celo Dollars'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the sender' }),
    to: Flags.address({ required: true, description: 'Address of the receiver' }),
    amountInWei: flags.string({ required: true, description: 'Amount to transfer (in wei)' }),
  }

  static examples = [
    'transferdollar --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --amountInWei 1',
  ]

  async run() {
    const res = this.parse(DollarTransfer)

    const from: string = res.flags.from
    const to: string = res.flags.to
    const amountInWei = new BigNumber(res.flags.amountInWei)

    this.kit.defaultAccount = from

    const goldToken = await this.kit.contracts.getGoldToken()
    const stableToken = await this.kit.contracts.getStableToken()
    // Units of all balances are in wei, unless specified.
    // Check the balance before
    const goldBalanceFromBefore = await goldToken.balanceOf(from)
    const dollarBalanceFromBefore = await stableToken.balanceOf(from)

    // Perform the transfer
    await displaySendTx('dollar.Transfer', stableToken.transfer(to, amountInWei.toString()))

    // Check the balance after
    const goldBalanceFromAfter = await goldToken.balanceOf(from)
    const dollarBalanceFromAfter = await stableToken.balanceOf(from)

    // Get gas cost
    const goldDifference = goldBalanceFromBefore.minus(goldBalanceFromAfter)
    const dollarDifference = dollarBalanceFromBefore.minus(dollarBalanceFromAfter)
    const gasCostInWei = goldDifference
    this.log(
      `Transferred ${amountInWei} from ${from} to ${to}, gas cost: ${gasCostInWei.toString()}`
    )
    this.log(
      `Dollar Balance of sender ${from} went down by ${dollarDifference.toString()} wei,` +
        `final balance: ${dollarBalanceFromAfter.toString()} Celo Dollars wei`
    )
    this.log(
      `Gold Balance of sender ${from} went down by ${goldDifference.toString()} wei, ` +
        `final balance: ${goldBalanceFromAfter.toString()} Celo Gold wei`
    )
  }
}
