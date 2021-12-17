import { CeloContract } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { failWith } from '../../utils/cli'

export default class List extends BaseCommand {
  static description = 'List oracle addresses for a given token'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [
    {
      name: 'token',
      required: true,
      description: 'Token to list the oracles for',
      default: CeloContract.StableToken,
    },
  ]

  static example = ['list StableToken', 'list', 'list StableTokenEUR']

  async run() {
    const res = this.parse(List)
    const sortedOracles = await this.kit.contracts.getSortedOracles()

    const oracles = await sortedOracles.getOracles(res.args.token).catch((e) => failWith(e))
    console.log(oracles)
  }
}
