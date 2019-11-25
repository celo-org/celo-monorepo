import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { swapArguments } from '../../utils/exchange'

export default class ExchangeGold extends BaseCommand {
  static description = 'Exchange Celo Gold for Celo Dollars via the stability mechanism'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'The address with Celo Gold to exchange' }),
    value: Flags.address({
      required: true,
      description: 'The value of Celo Gold to exchange for Celo Dollars',
    }),
    for: Flags.address({
      required: true,
      description: 'The minimum value of Celo Dollars to receive in return',
    }),
    commission: flags.string({ required: true }),
  }

  static args = []

  static examples = [
    'gold --value 5000000000000 --for 100000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]

  async run() {
    const { flags } = this.parse(ExchangeGold)
    const sellAmount = new BigNumber(flags.value)
    const minBuyAmount = new BigNumber(flags.for)

    this.kit.defaultAccount = flags.from
    const goldToken = await this.kit.contracts.getGoldToken()
    const exchange = await this.kit.contracts.getExchange()

    await displaySendTx('approve', goldToken.approve(exchange.address, sellAmount.toString()))

    const exchangeTx = exchange.exchange(sellAmount.toString(), minBuyAmount.toString(), true)
    await displaySendTx('exchange', exchangeTx)
  }
}
