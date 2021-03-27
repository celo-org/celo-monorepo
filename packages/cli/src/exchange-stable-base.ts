import { StableToken } from '@celo/contractkit'
import { stableTokenInfos } from '@celo/contractkit/lib/celo-tokens'
import { ParserOutput } from '@oclif/parser/lib/parse'
import BigNumber from 'bignumber.js'
import { BaseCommand } from './base'
import { newCheckBuilder } from './utils/checks'
import { displaySendTx, failWith } from './utils/cli'
import { Flags } from './utils/command'
import { checkNotDangerousExchange } from './utils/exchange'

const largeOrderPercentage = 1
const deppegedPricePercentage = 20
export default class ExchangeStableBase extends BaseCommand {
  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'The address with the Stable Token to exchange',
    }),
    value: Flags.wei({
      required: true,
      description: 'The value of Stable Tokens to exchange for CELO',
    }),
    forAtLeast: Flags.wei({
      description: 'Optional, the minimum value of CELO to receive in return',
      default: new BigNumber(0),
    }),
  }

  protected _stableCurrency: StableToken | null = null

  async run() {
    const res: ParserOutput<any, any> = this.parse()
    const sellAmount = res.flags.value
    const minBuyAmount = res.flags.forAtLeast

    if (!this._stableCurrency) {
      throw new Error('Stable currency not set')
    }
    await newCheckBuilder(this)
      .hasEnoughStable(res.flags.from, sellAmount, this._stableCurrency)
      .runChecks()

    let stableToken
    let exchange
    try {
      stableToken = await this.kit.contracts.getStableToken(this._stableCurrency)
      exchange = await this.kit.contracts.getExchange(this._stableCurrency)
    } catch {
      failWith(`The ${this._stableCurrency} token was not deployed yet`)
    }

    if (minBuyAmount.toNumber() === 0) {
      const check = await checkNotDangerousExchange(
        this.kit,
        sellAmount,
        largeOrderPercentage,
        deppegedPricePercentage,
        false,
        stableTokenInfos[this._stableCurrency]
      )

      if (!check) {
        console.log('Cancelled')
        return
      }
    }

    await displaySendTx(
      'increaseAllowance',
      stableToken.increaseAllowance(exchange.address, sellAmount.toFixed())
    )

    const exchangeTx = exchange.exchange(sellAmount.toFixed(), minBuyAmount!.toFixed(), false)
    // Set explicit gas based on github.com/celo-org/celo-monorepo/issues/2541
    await displaySendTx('exchange', exchangeTx, { gas: 300000 })
  }
}
