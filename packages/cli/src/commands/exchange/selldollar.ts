import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { swapArguments } from '../../utils/exchange'

export default class SellDollar extends BaseCommand {
  static description = 'Sell Celo dollars for Celo gold on the exchange'

  static args = swapArguments

  static examples = ['selldollar 100 300 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d']

  async run() {
    const { args } = this.parse(SellDollar)
    const sellAmount = new BigNumber(args.sellAmount)
    const minBuyAmount = new BigNumber(args.minBuyAmount)

    this.kit.defaultAccount = args.from
    const stableToken = await this.kit.contracts.getStableToken()
    const exchange = await this.kit.contracts.getExchange()

    await displaySendTx('approve', stableToken.approve(exchange.address, sellAmount.toString()))

    const exchangeTx = exchange.exchange(sellAmount.toString(), minBuyAmount.toString(), false)
    await displaySendTx('exchange', exchangeTx)
  }
}
