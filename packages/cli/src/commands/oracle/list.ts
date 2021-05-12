import { CeloContract } from '@celo/contractkit'
import { stableTokenContractArray } from '@celo/contractkit/lib/base'
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
      options: stableTokenContractArray,
      default: CeloContract.StableToken,
    },
  ]

  static example = ['list StableToken', 'list', 'list StableTokenEUR']

  async run() {
    const res = this.parse(List)
    const sortedOracles = await this.kit.contracts.getSortedOracles()

    try {
      await this.kit.registry.addressFor(res.args.token)
    } catch {
      failWith(`The ${res.args.token} contract was not deployed yet`)
    }

    const oracles = await sortedOracles.getOracles(res.args.token)
    console.log(oracles)
  }
}
