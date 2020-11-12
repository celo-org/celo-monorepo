import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class AttestedAccounts extends BaseCommand {
  static description = 'Parses Events for data'

  static flags = {
    ...BaseCommand.flags,
    toBlock: flags.string({ required: true, description: 'Ending Block' }),
    minimum: flags.integer({ required: true, description: 'Minimum attestations' }),
  }

  static examples = ['status']

  async run() {
    const res = this.parse(AttestedAccounts)
    const toBlock = res.flags.toBlock
    const minimum = res.flags.minimum
    const attestations = await this.kit.contracts.getAttestations()
    const accounts = await attestations.addrsWithNAttestations(minimum, toBlock)
    printValueMapRecursive(accounts)
    console.log('Total accounts reported:', accounts.length)
  }
}
