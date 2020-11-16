import { flags } from '@oclif/command'
import fs from 'fs'
import { EventLog } from 'web3-core'
import { BaseCommand } from '../../../base'
import { printValueMapRecursive } from '../../../utils/cli'
import { accountBalancesTWA } from '../../../utils/events'

export default class AccountBalancesTWA extends BaseCommand {
  static description = 'Parses Events for data'

  static flags = {
    ...BaseCommand.flags,
    initialBalances: flags.string({
      required: true,
      description:
        'file containing initial balances at the beginning of time-weighted average calculations',
    }),
    eventsJson: flags.string({
      required: true,
      multiple: true,
      description:
        'file containing transfer events during period of time-weighted average calculations',
    }),
    outputJson: flags.boolean({
      description: 'Write to json file titled with blocknumbers: balances-twa-50000-10000.json',
    }),
  }

  async run() {
    const res = this.parse(AccountBalancesTWA)
    const outputJson = res.flags.outputJson
    const initialBalances = JSON.parse(fs.readFileSync(res.flags.initialBalances, 'utf8'))
    // parse multiple Json events input files
    const events = res.flags.eventsJson.reduce((arr: EventLog[], eventsArr): EventLog[] => {
      const events = JSON.parse(fs.readFileSync(eventsArr, 'utf8'))
      return arr.concat(events)
    }, [])
    const balancesTWA = await accountBalancesTWA(events, initialBalances)

    // Output results to a JSON file if set
    if (outputJson) {
      fs.writeFile('balances-twa.json', JSON.stringify(balancesTWA, null, 2), (err) => {
        if (err) throw err
      })
    }

    printValueMapRecursive(balancesTWA)
    console.log('Total accounts reported:', Object.keys(balancesTWA).length)
  }
}
