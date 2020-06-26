import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { checkNotDangerousExchange } from '../../utils/exchange'

const largeOrderPercentage = 1
const deppegedPricePercentage = 20

export default class ExchangeCelo extends BaseCommand {
  static description =
    'Exchange CELO for Celo Dollars via the stability mechanism. (Note: this is the equivalent of the old exchange:gold)'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'The address with CELO to exchange' }),
    value: Flags.wei({
      required: true,
      description: 'The value of CELO to exchange for Celo Dollars',
    }),
    forAtLeast: Flags.wei({
      description: 'Optional, the minimum value of Celo Dollars to receive in return',
      default: new BigNumber(0),
    }),
  }

  static args = []

  static examples = [
    'celo --value 5000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
    'celo --value 5000000000000 --forAtLeast 100000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]

  async run() {
    const res = this.parse(ExchangeCelo)
    const sellAmount = res.flags.value
    const minBuyAmount = res.flags.forAtLeast

    if (minBuyAmount.toNumber() === 0) {
      const check = await checkNotDangerousExchange(
        this.kit,
        sellAmount,
        largeOrderPercentage,
        deppegedPricePercentage,
        true
      )

      if (!check) {
        console.log('Cancelled')
        return
      }
    }

    this.kit.defaultAccount = res.flags.from
    const celoToken = await this.kit.contracts.getGoldToken()
    const exchange = await this.kit.contracts.getExchange()

    await displaySendTx(
      'increaseAllowance',
      celoToken.increaseAllowance(exchange.address, sellAmount.toFixed())
    )

    const exchangeTx = exchange.exchange(sellAmount.toFixed(), minBuyAmount!.toFixed(), true)
    // Set explicit gas based on github.com/celo-org/celo-monorepo/issues/2541
    await displaySendTx('exchange', exchangeTx, { gas: 300000 })
  }
}
