import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class ParseEvents extends BaseCommand {
  static description = 'Parses Events for data'

  static flags = {
    ...BaseCommand.flags,
    fromBlock: flags.string({ required: true, description: 'Starting Block' }),
    toBlock: flags.string({ required: true, description: 'Ending Block' }),
  }

  static examples = ['status']

  async run() {
    const res = this.parse(ParseEvents)
    const fromBlock = res.flags.fromBlock
    const toBlock = res.flags.toBlock
    const stableToken = await this.kit.contracts.getStableToken()
    const balances = await stableToken.getAccountBalances(fromBlock, toBlock)
    printValueMapRecursive(balances)
    // console.log(balances.keys())
    console.log('Total accounts reported:', balances.size)
  }
}
