import { flags } from '@oclif/command'
import { BigNumber } from 'bignumber.js'
import fs from 'fs'
import { EventLog } from 'web3-core'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class AccountBalances extends BaseCommand {
  static description = 'Parses Events for data'

  static flags = {
    ...BaseCommand.flags,
    eventsJson: flags.string({ required: true, description: 'file containing transfer events' }),
    outputJson: flags.boolean({
      description: 'Write to JSON file titled with blocknumbers: balances0-100.json',
    }),
    startingBalances: flags.string(),
  }

  static examples = ['status']

  async run() {
    // const outputJson = res.flags.outputJson
    const res = this.parse(AccountBalances)
    const eventsJson = res.flags.eventsJson
    let balances: { [address: string]: BigNumber } = {}

    // Import events from file
    let events = JSON.parse(fs.readFileSync(eventsJson, 'utf8'))

    // Calculate Balances with Events
    events.forEach(function(eventlog: EventLog) {
      let amount = eventlog.returnValues.value
      let to = eventlog.returnValues.to
      let from = eventlog.returnValues.from
      balances[to]
        ? (balances[to] = balances[to].plus(amount))
        : (balances[to] = new BigNumber(amount))
      balances[from]
        ? (balances[from] = balances[from].minus(amount))
        : (balances[from] = new BigNumber(0))
    })

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
    // Print values to console

    // const stableToken = await this.kit.contracts.getStableToken()
    // let balances = await stableToken.getAccountBalances("0", "2000000")
    printValueMapRecursive(balances)
    console.log('Total accounts reported:', Object.keys(balances).length)
  }
}
