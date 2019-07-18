import { flags } from '@oclif/command'
import Web3 from 'web3'
import { BaseCommand } from '../../base'
import { StableToken } from '../../generated/contracts'
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
    const amountInWei = Web3.utils.toBN(res.flags.amountInWei)

    const stableTokenContract = await StableToken(this.web3)

    // Units of all balances are in wei, unless specified.
    // Check the balance before
    const goldBalanceFromBefore = Web3.utils.toBN(await this.web3.eth.getBalance(from))
    const dollarBalanceFromBefore = Web3.utils.toBN(
      await stableTokenContract.methods.balanceOf(from).call()
    )

    // Perform the transfer
    await displaySendTx(
      'dollar.Transfer',
      stableTokenContract.methods.transfer(to, amountInWei.toString())
    )

    // Check the balance after
    const goldBalanceFromAfter = Web3.utils.toBN(await this.web3.eth.getBalance(from))
    const dollarBalanceFromAfter = Web3.utils.toBN(
      await stableTokenContract.methods.balanceOf(from).call()
    )

    // Get gas cost
    const goldDifference = goldBalanceFromBefore.sub(goldBalanceFromAfter)
    const dollarDifference = dollarBalanceFromBefore.sub(dollarBalanceFromAfter)
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
