import { StableToken } from '@celo/contractkit'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { stableTokenInfos } from '@celo/contractkit/lib/celo-tokens'
import { flags } from '@oclif/command'
import { ParserOutput } from '@oclif/parser/lib/parse'
import BigNumber from 'bignumber.js'
import { BaseCommand } from './base'
import { newCheckBuilder } from './utils/checks'
import { displaySendTx, failWith } from './utils/cli'
import { Flags } from './utils/command'

export abstract class TransferStableBase extends BaseCommand {
  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the sender' }),
    to: Flags.address({ required: true, description: 'Address of the receiver' }),
    value: flags.string({ required: true, description: 'Amount to transfer (in wei)' }),
    comment: flags.string({ description: 'Transfer comment' }),
  }

  protected _stableCurrency: StableToken | null = null

  async run() {
    const res: ParserOutput<any, any> = this.parse()

    const from: string = res.flags.from
    const to: string = res.flags.to
    const value = new BigNumber(res.flags.value)

    if (!this._stableCurrency) {
      throw new Error('Stable currency not set')
    }
    let stableToken: StableTokenWrapper
    try {
      stableToken = await this.kit.contracts.getStableToken(this._stableCurrency)
    } catch {
      failWith(`The ${this._stableCurrency} token was not deployed yet`)
    }
    // If gasCurrency is not set, use the transferring token
    if (!res.flags.gasCurrency) {
      await this.kit.setFeeCurrency(stableTokenInfos[this._stableCurrency].contract)
    }

    const tx = res.flags.comment
      ? stableToken.transferWithComment(to, value.toFixed(), res.flags.comment)
      : stableToken.transfer(to, value.toFixed())

    await newCheckBuilder(this)
      .hasEnoughStable(from, value, this._stableCurrency)
      .addConditionalCheck(
        `Account can afford transfer and gas paid in ${this._stableCurrency}`,
        this.kit.connection.defaultFeeCurrency === stableToken.address,
        async () => {
          const [gas, gasPrice, balance] = await Promise.all([
            tx.txo.estimateGas({ feeCurrency: stableToken.address }),
            this.kit.connection.gasPrice(stableToken.address),
            stableToken.balanceOf(from),
          ])
          const gasValue = new BigNumber(gas).times(gasPrice as string)
          return balance.gte(value.plus(gasValue))
        },
        `Cannot afford transfer with ${this._stableCurrency} gasCurrency; try reducing value slightly or using gasCurrency=CELO`
      )
      .runChecks()

    await displaySendTx(res.flags.comment ? 'transferWithComment' : 'transfer', tx)
  }
}
