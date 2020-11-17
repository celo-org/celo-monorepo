import { flags } from '@oclif/command'
import fs from 'fs'
import { EventLog } from 'web3-core'
import { BaseCommand } from '../../../base'
import { printValueMapRecursive } from '../../../utils/cli'
import { accountBalances } from '../../../utils/events'

export default class AccountBalances extends BaseCommand {
  static description = 'Parses Events for data'

  static flags = {
    ...BaseCommand.flags,
    eventsJson: flags.string({
      required: true,
      // since the number of events can be large, you may be splitting them over several files
      multiple: true,
      description: 'files containing transfer events',
    }),
    filter: flags.string({
      required: false,
      description: 'json file with list of addresses to filter by',
    }),
    outputJson: flags.boolean({
      description: 'Write to json file titled with blocknumbers: balances0-100.json',
    }),
  }

  async run() {
    const res = this.parse(AccountBalances)
    const outputJson = res.flags.outputJson
    const filter = res.flags.filter
    const filterByAddrs = filter ? JSON.parse(fs.readFileSync(filter, 'utf8')) : undefined
    // parse multiple Json events input files
    const events = res.flags.eventsJson.reduce((arr: EventLog[], eventsArr): EventLog[] => {
      const events = JSON.parse(fs.readFileSync(eventsArr, 'utf8'))
      return arr.concat(events)
    }, [])
    const balances = await accountBalances(events, filterByAddrs)

    // Output results to a JSON file if set
    if (outputJson) {
      const fileName = `balances${filter ? '-filtered' : ''}.json`
      fs.writeFile(fileName, JSON.stringify(balances, null, 2), (err) => {
        if (err) throw err
      })
      console.log(`Results output to: ${fileName}`)
    } else {
      printValueMapRecursive(balances)
    }
    console.log('Total accounts reported:', Object.keys(balances).length)
  }
}
