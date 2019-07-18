import { flags } from '@oclif/command'
import Web3 from 'web3'
import { BaseCommand } from '../../base'
import { GoldToken } from '../../generated/contracts'
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
    const amountInWei = Web3.utils.toBN(res.flags.amountInWei)

    const goldTokenContract = await GoldToken(this.web3)

    // Check the balance before
    const balanceFromBeforeInWei = Web3.utils.toBN(await this.web3.eth.getBalance(from))

    // Perform the transfer
    await displaySendTx(
      'gold.Transfer',
      goldTokenContract.methods.transfer(to, amountInWei.toString())
    )

    // Check the balance after
    const balanceFromAfterInWei = Web3.utils.toBN(await this.web3.eth.getBalance(from))

    // Get gas cost
    const differenceInWei = balanceFromBeforeInWei.sub(balanceFromAfterInWei)
    const gasCostInWei = differenceInWei.sub(amountInWei)
    this.log(
      `Transferred ${amountInWei} from ${from} to ${to}, gas cost: ${gasCostInWei.toString()} wei`
    )
    this.log(
      `Balance of sender ${from} went down by ${differenceInWei.toString()} wei, final balance: ${balanceFromAfterInWei} Celo Gold wei`
    )
  }
}
