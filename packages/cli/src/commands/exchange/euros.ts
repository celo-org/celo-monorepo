import { StableToken } from '@celo/contractkit'
import ExchangeStableBase from '../../exchange-stable-base'
import { Flags } from '../../utils/command'
export default class ExchangeEuros extends ExchangeStableBase {
  static description = 'Exchange Celo Euros for CELO via the stability mechanism'

  static flags = {
    ...ExchangeStableBase.flags,
    from: Flags.address({
      required: true,
      description: 'The address with Celo Euros to exchange',
    }),
    value: Flags.wei({
      required: true,
      description: 'The value of Celo Euros to exchange for CELO',
    }),
  }

  static examples = [
    'euros --value 10000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
    'euros --value 10000000000000 --forAtLeast 50000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]

  async init() {
    this._stableCurrency = StableToken.cEUR
    await super.init()
  }
}
