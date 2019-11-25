import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ExchangeDollars extends BaseCommand {
  static description = 'Exchange Celo Dollars for Celo Gold via the stability mechanism'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'The address with Celo Dollars to exchange',
    }),
    value: Flags.address({
      required: true,
      description: 'The value of Celo Dollars to exchange for Celo Gold',
    }),
    for: Flags.address({
      required: true,
      description: 'The minimum value of Celo Gold to receive in return',
    }),
    commission: flags.string({ required: true }),
  }

  static args = []

  static examples = [
    'dollars --value 10000000000000 --for 50000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]

  async run() {
    const res = this.parse(ExchangeDollars)
    const sellAmount = new BigNumber(res.flags.value)
    const minBuyAmount = new BigNumber(res.flags.for)

    this.kit.defaultAccount = res.flags.from
    const stableToken = await this.kit.contracts.getStableToken()
    const exchange = await this.kit.contracts.getExchange()

    await displaySendTx('approve', stableToken.approve(exchange.address, sellAmount.toFixed()))

    const exchangeTx = exchange.exchange(sellAmount.toFixed(), minBuyAmount.toFixed(), false)
    await displaySendTx('exchange', exchangeTx)
  }
}
