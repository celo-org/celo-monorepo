import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class TransferDollars extends BaseCommand {
  static description = 'Transfer Celo Dollars to a specified address.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the sender' }),
    to: Flags.address({ required: true, description: 'Address of the receiver' }),
    value: flags.string({ required: true, description: 'Amount to transfer (in wei)' }),
    comment: flags.string({ description: 'Transfer comment' }),
  }

  static examples = [
    'dollars --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 1000000000000000000',
  ]

  async run() {
    const res = this.parse(TransferDollars)

    const from: string = res.flags.from
    const to: string = res.flags.to
    const value = new BigNumber(res.flags.value)

    const stableToken = await this.kit.contracts.getStableToken()

    const tx = res.flags.comment
      ? stableToken.transferWithComment(to, value.toFixed(), res.flags.comment)
      : stableToken.transfer(to, value.toFixed())

    await newCheckBuilder(this)
      .hasEnoughUsd(from, value)
      .addConditionalCheck(
        'Account can afford transfer and gas paid in cUSD',
        this.kit.defaultFeeCurrency === stableToken.address,
        async () => {
          const gas = await tx.txo.estimateGas({ feeCurrency: stableToken.address })
          // TODO: replace with gasPrice rpc once supported by min client version
          const { gasPrice } = await this.kit.fillGasPrice({
            gasPrice: '0',
            feeCurrency: stableToken.address,
          })
          const gasValue = new BigNumber(gas).times(gasPrice as string)
          const balance = await stableToken.balanceOf(from)
          return balance.gte(value.plus(gasValue))
        },
        `Cannot afford transfer with cUSD gasCurrency; try reducing value slightly or using gasCurrency=CELO`
      )
      .runChecks()

    await displaySendTx(res.flags.comment ? 'transferWithComment' : 'transfer', tx)
  }
}
