import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { swapArguments } from '../../utils/exchange'

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
    const { flags } = this.parse(ExchangeDollars)
    const sellAmount = new BigNumber(flags.value)
    const minBuyAmount = new BigNumber(flags.for)

    this.kit.defaultAccount = flags.from
    const stableToken = await this.kit.contracts.getStableToken()
    const exchange = await this.kit.contracts.getExchange()

    await displaySendTx('approve', stableToken.approve(exchange.address, sellAmount.toString()))

    const exchangeTx = exchange.exchange(sellAmount.toString(), minBuyAmount.toString(), false)
    await displaySendTx('exchange', exchangeTx)
  }
}
