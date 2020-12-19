import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class TransferCelo extends BaseCommand {
  static description =
    'Transfer CELO to a specified address. (Note: this is the equivalent of the old transfer:gold)'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the sender' }),
    to: Flags.address({ required: true, description: 'Address of the receiver' }),
    value: flags.string({ required: true, description: 'Amount to transfer (in wei)' }),
    comment: flags.string({ description: 'Transfer comment' }),
    withTxVerification: flags.boolean({
      default: false,
      description:
        '(For transactions bigger than 200 CELO) This flag allows the user to generate the transfer in two different transactions. The first one will be for a random amount lesser than 1 CELO, that will be required as an input to perform the second transaction with the rest of the transfer',
    }),
  }

  static examples = [
    'celo --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 10000000000000000000',
    'celo --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 10000000000000000000 --withTxVerification',
  ]

  async run() {
    const res = this.parse(TransferCelo)

    const from: string = res.flags.from
    const to: string = res.flags.to
    let value = new BigNumber(res.flags.value)

    this.kit.defaultAccount = from
    const celoToken = await this.kit.contracts.getGoldToken()

    await newCheckBuilder(this)
      .hasEnoughCelo(from, value)
      .runChecks()

    if (res.flags.withTxVerification && value.isGreaterThanOrEqualTo(new BigNumber('200e18'))) {
      const firstTxValue = BigNumber.random(18).multipliedBy('1e18')

      cli.action.start(`Sending Verifiying Transaction...`)
      const txResult = await celoToken
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

      value = value.minus(firstTxValue)
    }

    if (res.flags.comment) {
      await displaySendTx(
        'transferWithComment',
        celoToken.transferWithComment(to, value.toFixed(), res.flags.comment)
      )
    } else {
      await displaySendTx('transfer', celoToken.transfer(to, value.toFixed()))
    }
  }
}
