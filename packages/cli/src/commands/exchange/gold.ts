import ExchangeCelo from './celo'

export default class ExchangeGold extends ExchangeCelo {
  static description =
    'Exchange CELO for Celo Dollars via the stability mechanism. *DEPRECATION WARNING* Use the "exchange:celo" command instead'

  static flags = {
    ...ExchangeCelo.flags,
  }

  static args = []

  static examples = [
    'gold --value 5000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
    'gold --value 5000000000000 --forAtLeast 100000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]
}
