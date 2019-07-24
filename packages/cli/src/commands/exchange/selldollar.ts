import { BaseCommand } from '../../base'
import { StableToken } from '../../generated/contracts'
import { doSwap, swapArguments } from '../../utils/exchange'

export default class SellDollar extends BaseCommand {
  static description = 'Sell Celo dollars for Celo gold on the exchange'

  static args = swapArguments

  static examples = ['selldollar 100 300 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d']

  async run() {
    const { args } = this.parse(SellDollar)

    const stableToken = await StableToken(this.web3, args.from)

    await doSwap(this.web3, args, stableToken, false)
  }
}
