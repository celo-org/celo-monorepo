import { BaseCommand } from '../../base'
import { GoldToken } from '../../generated/contracts'
import { doSwap, swapArguments } from '../../utils/exchange'

export default class SellGold extends BaseCommand {
  static description = 'Sell Celo gold for Celo dollars on the exchange'

  static args = swapArguments

  static examples = ['sellgold 100 300 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d']

  async run() {
    const { args } = this.parse(SellGold)

    const goldToken = await GoldToken(this.web3, args.from)

    await doSwap(this.web3, args, goldToken, true)
  }
}
