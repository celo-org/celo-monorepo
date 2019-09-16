import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { swapArguments } from '../../utils/exchange'

export default class SellGold extends BaseCommand {
  static description = 'Sell Celo gold for Celo dollars on the exchange'

  static args = swapArguments

  static examples = ['sellgold 100 300 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d']

  async run() {
    const { args } = this.parse(SellGold)
    const sellAmount = new BigNumber(args.sellAmount)
    const minBuyAmount = new BigNumber(args.minBuyAmount)

    this.kit.defaultAccount = args.from
    const goldToken = await this.kit.contracts.getGoldToken()
    const exchange = await this.kit.contracts.getExchange()

    await displaySendTx('approve', goldToken.approve(exchange.address, sellAmount.toString()))

    const exchangeTx = exchange.exchange(sellAmount.toString(), minBuyAmount.toString(), true)
    await displaySendTx('exchange', exchangeTx)
  }
}
