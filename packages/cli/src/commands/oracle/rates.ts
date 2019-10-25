import { CeloContract, CeloToken } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { failWith } from '../../utils/cli'

export default class GetRates extends BaseCommand {
  static description = 'Get the current set oracle-reported rates for the given token'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [{ name: 'token', required: true, description: 'Token to get the rates for' }]

  static example = ['rates StableToken']

  async run() {
    const supportedTokens: CeloToken[] = [CeloContract.StableToken]
    const res = this.parse(GetRates)
    if (!supportedTokens.includes(res.args.token)) {
      return failWith(`${res.args.token} is not in the set of supported tokens: ${supportedTokens}`)
    }
    const sortedOracles = await this.kit.contracts.getSortedOracles()

    const rates = await sortedOracles.getRates(res.args.token)
    console.log(
      rates.map((r) => {
        return {
          address: r.address,
          rate: r.rate.toNumber(),
        }
      })
    )
  }
}
