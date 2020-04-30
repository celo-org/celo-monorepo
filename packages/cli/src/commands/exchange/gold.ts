import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ExchangeGold extends BaseCommand {
  static description = 'Exchange Celo Gold for Celo Dollars via the stability mechanism'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'The address with Celo Gold to exchange' }),
    value: Flags.wei({
      required: true,
      description: 'The value of Celo Gold to exchange for Celo Dollars',
    }),
    forAtLeast: Flags.wei({
      description: 'Optional, the minimum value of Celo Dollars to receive in return',
      default: new BigNumber(0),
    }),
  }

  static args = []

  static examples = [
    'gold --value 5000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
    'gold --value 5000000000000 --forAtLeast 100000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]

  async run() {
    const res = this.parse(ExchangeGold)
    const sellAmount = res.flags.value
    const minBuyAmount = res.flags.forAtLeast

    this.kit.defaultAccount = res.flags.from
    const goldToken = await this.kit.contracts.getGoldToken()
    const exchange = await this.kit.contracts.getExchange()

    await displaySendTx(
      'increaseAllowance',
      goldToken.increaseAllowance(exchange.address, sellAmount.toFixed())
    )

    const exchangeTx = exchange.exchange(sellAmount.toFixed(), minBuyAmount!.toFixed(), true)
    // Set explicit gas based on github.com/celo-org/celo-monorepo/issues/2541
    await displaySendTx('exchange', exchangeTx, { gas: 300000 })
  }
}
