import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { cli } from 'cli-ux'
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
    withTxVerification: flags.boolean({
      default: false,
      description:
        '(For transactions bigger than 500 cUSD) This flag allows the user to generate the transfer in two different transactions. The first one will be for a random amount lesser than 1 cUSD, that will be required as an input to perform the second transaction with the rest of the transfer',
    }),
  }

  static examples = [
    'dollars --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 1000000000000000000',
    'dollars --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 1000000000000000000 --withTxVerification',
  ]

  async run() {
    const res = this.parse(TransferDollars)

    const from: string = res.flags.from
    const to: string = res.flags.to
    let value = new BigNumber(res.flags.value)
    const totalValue = value
    let requireTwoTx = false
    let firstTxValue = new BigNumber(0)

    const stableToken = await this.kit.contracts.getStableToken()

    if (res.flags.withTxVerification && value.isGreaterThanOrEqualTo(new BigNumber('500e18'))) {
      requireTwoTx = true
      firstTxValue = BigNumber.random(18).multipliedBy('1e18')
      value = value.minus(firstTxValue)
    }

    const tx = res.flags.comment
      ? stableToken.transferWithComment(to, value.toFixed(), res.flags.comment)
      : stableToken.transfer(to, value.toFixed())

    await newCheckBuilder(this)
      .hasEnoughUsd(from, totalValue)
      .addConditionalCheck(
        'Account can afford transfer and gas paid in cUSD',
        this.kit.defaultFeeCurrency === stableToken.address,
        async () => {
          let gas = await tx.txo.estimateGas({ feeCurrency: stableToken.address })
          if (
            res.flags.withTxVerification &&
            value.isGreaterThanOrEqualTo(new BigNumber('500e18'))
          ) {
            gas = gas * 2 // will require 2 transactions
          }
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

    if (requireTwoTx) {
      cli.action.start(`Sending Verifiying Transaction...`)
      const txResult = await stableToken
        .transferWithComment(to, firstTxValue.toFixed(), 'Verificable Tx')
        .send()

      await txResult.waitReceipt()
      cli.action.stop()

      let retries = 3
      let preMessage = ''
      do {
        const response: string = await cli.prompt(
          `${preMessage}Insert the value in wei of the transaction used as verifier`,
          { required: true }
        )

        if (!firstTxValue.eq(response.trim())) {
          retries = retries - 1
          if (retries === 0) {
            throw new Error("Wrong transaction amount. Second transaction won't be executed")
          } else {
            preMessage = `(Wrong amount, attempts left: ${retries}) `
          }
        } else {
          retries = 0
        }
      } while (retries > 0)
    }

    await displaySendTx(res.flags.comment ? 'transferWithComment' : 'transfer', tx)
  }
}
