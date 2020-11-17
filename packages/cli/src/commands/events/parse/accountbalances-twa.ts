import { flags } from '@oclif/command'
import { BigNumber } from 'bignumber.js'
import fs from 'fs'
import { EventLog } from 'web3-core'
import { BaseCommand } from '../../../base'
import { printValueMapRecursive } from '../../../utils/cli'
import { accountBalancesTWA } from '../../../utils/events'

export default class AccountBalancesTWA extends BaseCommand {
  static description = 'Parses events data to find the time-weighted balance over a range of blocks'

  static flags = {
    ...BaseCommand.flags,
    fromBlock: flags.integer({ required: true, description: 'starting block' }),
    toBlock: flags.integer({ required: true, description: 'ending block' }),
    initialBalances: flags.string({
      required: true,
      description:
        'json file containing initial balances at the start of time-weighted average calculations',
    }),
    eventsJson: flags.string({
      required: true,
      // since the number of events can be large, you may be splitting them over several files
      multiple: true,
      description:
        'json file containing transfer events during period of time-weighted average calculations',
    }),
    outputJson: flags.boolean({
      description: 'Write to json file titled with blocknumbers: balances-twa-50000-10000.json',
    }),
  }

  async run() {
    const res = this.parse(AccountBalancesTWA)
    const outputJson = res.flags.outputJson
    const initialBalances = JSON.parse(fs.readFileSync(res.flags.initialBalances, 'utf8'))
    const fromBlock = res.flags.fromBlock
    const toBlock = res.flags.toBlock

    // parse multiple Json events input files
    const events = res.flags.eventsJson.reduce((arr: EventLog[], events): EventLog[] => {
      const eventsArr = JSON.parse(fs.readFileSync(events, 'utf8'))
      return arr.concat(eventsArr)
    }, [])

    // parse JSON strings to BigNumber
    Object.keys(initialBalances).forEach(
      (acct) => (initialBalances[acct] = new BigNumber(initialBalances[acct]))
    )

    // get time-weighted-average
    const balancesTWA = await accountBalancesTWA(events, initialBalances, fromBlock, toBlock)

    // output results
    if (outputJson) {
      const fileName = 'balances-twa.json'
      fs.writeFile(fileName, JSON.stringify(balancesTWA, null, 2), (err) => {
        if (err) throw err
      })
      console.log(`Results output to: ${fileName}`)
    } else {
      printValueMapRecursive(balancesTWA)
    }
    console.log('Total accounts reported:', Object.keys(balancesTWA).length)
  }
}
