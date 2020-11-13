import { flags } from '@oclif/command'
import fs from 'fs'
import { BaseCommand } from '../../../base'
import { printValueMapRecursive } from '../../../utils/cli'
import { accountBalances } from '../../../utils/events'

export default class AccountBalances extends BaseCommand {
  static description = 'Parses Events for data'

  static flags = {
    ...BaseCommand.flags,
    eventsJson: flags.string({ required: true, description: 'file containing transfer events' }),
    filterByAddrs: flags.string({
      required: false,
      description: 'json file with list of addresses to filter by',
    }),
    outputJson: flags.boolean({
      description: 'Write to json file titled with blocknumbers: balances0-100.json',
    }),
  }

  async run() {
    // const outputJson = res.flags.outputJson
    const res = this.parse(AccountBalances)
    const events = JSON.parse(fs.readFileSync(res.flags.eventsJson, 'utf8'))
    const filter = res.flags.filterByAddrs
    const filterByAddrs = filter ? JSON.parse(fs.readFileSync(res.flags.eventsJson, 'utf8')) : []
    const balances = await accountBalances(events, filterByAddrs)

    // // Output results to a JSON file if set
    // if (outputJson) {
    //   fs.writeFile(
    //     `balances${fromBlock}-${toBlock}.json`,
    //     JSON.stringify(balances, null, 2),
    //     (err) => {
    //       if (err) throw err
    //     }
    //   )
    // }

    printValueMapRecursive(balances)
    console.log('Total accounts reported:', Object.keys(balances).length)
  }
}
