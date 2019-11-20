import { CeloContract } from '@celo/contractkit'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class GetRates extends BaseCommand {
  static description = 'Get the current set oracle-reported rates for the given token'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [
    {
      name: 'token',
      required: true,
      description: 'Token to get the rates for',
      options: [CeloContract.StableToken],
      default: CeloContract.StableToken,
    },
  ]

  static example = ['rates StableToken', 'rates']

  async run() {
    const res = this.parse(GetRates)
    const sortedOracles = await this.kit.contracts.getSortedOracles()

    const rates = await sortedOracles.getRates(res.args.token)
    cli.table(rates, {
      address: {},
      rate: { get: (r) => r.rate.toNumber() },
    })
  }
}
