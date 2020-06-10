import { CeloContract } from '@celo/contractkit'
import { BaseCommand } from '../../base'

export default class List extends BaseCommand {
  static description = 'List oracle addresses for a given token'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  static args = [
    {
      name: 'token',
      required: true,
      description: 'Token to list the oracles for',
      options: [CeloContract.StableToken],
      default: CeloContract.StableToken,
    },
  ]

  static example = ['list StableToken', 'list']

  async run() {
    const res = this.parse(List)
    const sortedOracles = await this.kit.contracts.getSortedOracles()

    const oracles = await sortedOracles.getOracles(res.args.token)
    console.log(oracles)
  }
}
