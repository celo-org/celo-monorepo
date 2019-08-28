import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class GoldTransfer extends BaseCommand {
  static description = 'Transfer gold'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the sender' }),
    to: Flags.address({ required: true, description: 'Address of the receiver' }),
    amountInWei: flags.string({ required: true, description: 'Amount to transfer (in wei)' }),
  }

  static examples = [
    'transfergold --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --amountInWei 1',
  ]

  async run() {
    const res = this.parse(GoldTransfer)

    const from: string = res.flags.from
    const to: string = res.flags.to
    const amountInWei = new BigNumber(res.flags.amountInWei)

    this.kit.defaultAccount = from
    // Units of all balances are in wei, unless specified.
    // Check the balance before
    const goldToken = await this.kit.contracts.getGoldToken()

    // Check the balance before
    const balanceFromBeforeInWei = await goldToken.balanceOf(from)

    // Perform the transfer
    await displaySendTx('gold.Transfer', goldToken.transfer(to, amountInWei.toString()))

    // Check the balance after
    const balanceFromAfterInWei = await goldToken.balanceOf(from)

    // Get gas cost
    const differenceInWei = balanceFromBeforeInWei.minus(balanceFromAfterInWei)
    const gasCostInWei = differenceInWei.minus(amountInWei)
    this.log(
      `Transferred ${amountInWei} from ${from} to ${to}, gas cost: ${gasCostInWei.toString()} wei`
    )
    this.log(
      `Balance of sender ${from} went down by ${differenceInWei.toString()} wei, final balance: ${balanceFromAfterInWei} Celo Gold wei`
    )
  }
}
