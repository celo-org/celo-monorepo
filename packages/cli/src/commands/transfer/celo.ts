import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
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
  }

  static examples = [
    'celo --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 10000000000000000000',
  ]

  async run() {
    const res = this.parse(TransferCelo)

    const from: string = res.flags.from
    const to: string = res.flags.to
    const value = new BigNumber(res.flags.value)

    this.kit.defaultAccount = from
    const usdToken = await this.kit.contracts.getStableToken()

    await newCheckBuilder(this)
      .hasEnoughCelo(from, value)
      .runChecks()

    await this.kit.connection
      .sendTransaction({
        from,
        to,
        value: value.toString(),
        feeCurrency: usdToken.address,
      })
      .then((result) => result.waitReceipt())
  }
}
