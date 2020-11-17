import { flags } from '@oclif/command'
import fs from 'fs'
import { BaseCommand } from '../../../base'
import { printValueMapRecursive } from '../../../utils/cli'
import { attestedAccounts } from '../../../utils/events'

export default class AttestedAccounts extends BaseCommand {
  static description = 'Parses Events for data'

  static flags = {
    ...BaseCommand.flags,
    minimum: flags.integer({ required: true, description: 'Minimum attestations' }),
    eventsJson: flags.string({
      required: true,
      description: 'File containing AttestationCompleted events',
    }),
    outputJson: flags.boolean({
      description: 'Write results to json file titled accounts-<minimum>-attestations.json',
    }),
  }

  async run() {
    const res = this.parse(AttestedAccounts)
    const minimum = res.flags.minimum
    const outputJson = res.flags.outputJson
    const events = JSON.parse(fs.readFileSync(res.flags.eventsJson, 'utf8'))
    const verifiedAccounts = await attestedAccounts(events, minimum)

    // Output results to a JSON file if set
    if (outputJson) {
      const fileName = `accounts-${minimum}-attestations.json`
      fs.writeFile(fileName, JSON.stringify(verifiedAccounts, null, 2), (err) => {
        if (err) throw err
      })
      console.log(`Results output to: ${fileName}`)
    } else {
      printValueMapRecursive(verifiedAccounts)
    }
    console.log('Total verified accounts reported:', verifiedAccounts.length)
  }
}
