import { flags } from '@oclif/command'
import fs from 'fs'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class AccountBalances extends BaseCommand {
  static description = 'Parses Events for data'

  static flags = {
    ...BaseCommand.flags,
    fromBlock: flags.string({ required: true, description: 'Starting Block' }),
    toBlock: flags.string({ required: true, description: 'Ending Block' }),
    outputJson: flags.boolean({
      description: 'Write to JSON file titled with blocknumbers: balances0-100.json',
    }),
    startingBalances: flags.string(),
  }

  static examples = ['status']

  async run() {
    const res = this.parse(AccountBalances)
    const fromBlock = res.flags.fromBlock
    const toBlock = res.flags.toBlock
    const outputJson = res.flags.outputJson
    const stableToken = await this.kit.contracts.getStableToken()
    const balances = await stableToken.getAccountBalances(fromBlock, toBlock)
    // Output results to a JSON file if set
    if (outputJson) {
      fs.writeFile(
        `balances${fromBlock}-${toBlock}.json`,
        JSON.stringify(balances, null, 2),
        (err) => {
          if (err) throw err
        }
      )
    }
    // Print values to console
    printValueMapRecursive(balances)
    console.log('Total accounts reported:', Object.keys(balances).length)
  }
}
