import { CeloContract } from '@celo/contractkit'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand, GasOptions } from '../../base'
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

    this.kit.defaultAccount = from
    const stableToken = await this.kit.contracts.getStableToken()

    const tx = res.flags.comment
      ? stableToken.transferWithComment(to, value.toFixed(), res.flags.comment)
      : stableToken.transfer(to, value.toFixed())

    // resolve auto gasCurrencyConfig such that feeCurrency is cUSD with sufficient balance
    if (this.gasCurrencyConfig && this.gasCurrencyConfig === GasOptions.auto) {
      const gas = await tx.txo.estimateGas({ feeCurrency: stableToken.address })
      const { gasPrice } = await this.kit.fillGasPrice({
        gasPrice: '0',
        feeCurrency: stableToken.address,
      })
      const balance = await stableToken.balanceOf(from)
      // check if cUSD balance is sufficient for transfer + gas
      if (value.plus(new BigNumber(gas).times(gasPrice as string)).isLessThanOrEqualTo(balance)) {
        await this.kit.setFeeCurrency(CeloContract.StableToken)
      }
    }

    await newCheckBuilder(this)
      .hasEnoughUsd(from, value)
      .runChecks()

    await displaySendTx(res.flags.comment ? 'transferWithComment' : 'transfer', tx)
  }
}
