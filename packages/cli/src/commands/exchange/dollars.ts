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
    value: Flags.wei({
      required: true,
      description: 'The value of Celo Dollars to exchange for Celo Gold',
    }),
    forAtLeast: Flags.wei({
      description: 'Optional, the minimum value of Celo Gold to receive in return',
      default: new BigNumber(0),
    }),
  }

  static args = []

  static examples = [
    'dollars --value 10000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
    'dollars --value 10000000000000 --forAtLeast 50000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]

  async run() {
    const res = this.parse(ExchangeDollars)
    const sellAmount = res.flags.value
    const minBuyAmount = res.flags.forAtLeast

    this.kit.defaultAccount = res.flags.from
    const stableToken = await this.kit.contracts.getStableToken()
    const exchange = await this.kit.contracts.getExchange()

    await displaySendTx(
      'increaseAllowance',
      stableToken.increaseAllowance(exchange.address, sellAmount.toFixed())
    )

    const exchangeTx = exchange.exchange(sellAmount.toFixed(), minBuyAmount!.toFixed(), false)
    // Set explicit gas based on github.com/celo-org/celo-monorepo/issues/2541
    await displaySendTx('exchange', exchangeTx, { gas: 300000 })
  }
}
