import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { checkNotDangerousExchange } from '../../utils/exchange'

const largeOrderPercentage = 1
const deppegedPricePercentage = 20
export default class ExchangeDollars extends BaseCommand {
  static description = 'Exchange Celo Dollars for CELO via the stability mechanism'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'The address with Celo Dollars to exchange',
    }),
    value: Flags.wei({
      required: true,
      description: 'The value of Celo Dollars to exchange for CELO',
    }),
    forAtLeast: Flags.wei({
      description: 'Optional, the minimum value of CELO to receive in return',
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

    if (minBuyAmount.toNumber() === 0) {
      const check = await checkNotDangerousExchange(
        this.kit,
        sellAmount,
        largeOrderPercentage,
        deppegedPricePercentage,
        false
      )

      if (!check) {
        console.log('Cancelled')
        return
      }
    }

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
