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
      description: 'file containing AttestationCompleted events',
    }),
    filterByAddress: flags.string({
      required: false,
      description: 'json file with list of addresses to filter by',
    }),
  }

  async run() {
    const res = this.parse(AttestedAccounts)
    const minimum = res.flags.minimum
    const events = JSON.parse(fs.readFileSync(res.flags.eventsJson, 'utf8'))
    const verifiedAccounts = await attestedAccounts(minimum, events)

    printValueMapRecursive(verifiedAccounts)
    console.log('Total verified accounts reported:', verifiedAccounts.length)
  }
}
