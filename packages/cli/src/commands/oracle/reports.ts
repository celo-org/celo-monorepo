import { CeloContract } from '@celo/contractkit'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class Reports extends BaseCommand {
  static description = 'List oracle reports for a given token'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
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

  static example = ['reports StableToken', 'reports']

  async run() {
    const res = this.parse(Reports)
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
