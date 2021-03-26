import { StableToken } from '@celo/contractkit'
import { flags } from '@oclif/command'
import ExchangeStableBase from '../../exchange-stable-base'

export default class ExchangeStable extends ExchangeStableBase {
  static description = 'Exchange Stable Token for CELO via the stability mechanism'

  static flags = {
    ...ExchangeStableBase.flags,
    stableToken: flags.enum({
      options: Object.keys(StableToken),
      description: 'Name of the stable token to be transfered',
    }),
  }

  static examples = [
    'stable --value 10000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --stableToken cUSD',
    'stable --value 10000000000000 --forAtLeast 50000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --stableToken cUSD',
  ]

  async init() {
    const res = this.parse(ExchangeStable)
    const stableName = res.flags.stableToken
    this._stableCurrency = StableToken[stableName as keyof typeof StableToken]
    await super.init()
  }
}
