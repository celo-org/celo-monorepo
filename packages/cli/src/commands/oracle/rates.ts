import { CeloContract } from '@celo/contractkit'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class GetRates extends BaseCommand {
  static description = 'List oracle reports for a given token'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [
    {
      name: 'token',
      required: true,
      description: 'Token to list the reports for',
      options: [CeloContract.StableToken],
      default: CeloContract.StableToken,
    },
  ]

  static example = ['rates StableToken', 'rates']

  async run() {
    const res = this.parse(GetRates)
    const sortedOracles = await this.kit.contracts.getSortedOracles()

    const reports = await sortedOracles.getReports(res.args.token)
    cli.table(
      reports,
      {
        address: {},
        rate: { get: (r) => r.rate.toNumber() },
        timestamp: { get: (r) => r.timestamp.toNumber() },
      },
      { 'no-truncate': !res.flags.truncate }
    )
  }
}
