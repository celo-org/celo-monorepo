import { CeloContract } from '@celo/contractkit'
import { stableTokenContractArray } from '@celo/contractkit/lib/base'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { failWith } from '../../utils/cli'

export default class Reports extends BaseCommand {
  static description = 'List oracle reports for a given token'

  static flags = {
    ...BaseCommand.flags,
    ...(cli.table.flags() as object),
  }

  static args = [
    {
      name: 'token',
      required: true,
      description: 'Token to list the reports for',
      options: stableTokenContractArray,
      default: CeloContract.StableToken,
    },
  ]

  static example = ['reports StableToken', 'reports', 'reports StableTokenEUR']

  async run() {
    const res = this.parse(Reports)
    const sortedOracles = await this.kit.contracts.getSortedOracles()

    try {
      await this.kit.registry.addressFor(res.args.token)
    } catch {
      failWith(`The ${res.args.token} contract was not deployed yet`)
    }

    const reports = await sortedOracles.getReports(res.args.token)
    cli.table(
      reports,
      {
        address: {},
        rate: { get: (r) => r.rate.toNumber() },
        timestamp: { get: (r) => r.timestamp.toNumber() },
      },
      res.flags
    )
  }
}
