import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class View extends BaseCommand {
  static description = 'View governance proposal information from ID'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to view' }),
  }

  static examples = []

  async run() {
    const res = this.parse(View)

    const governance = await this.kit.contracts.getGovernance()
    const record = await governance.getProposalRecord(res.flags.proposalID)
    printValueMapRecursive(record)
  }
}
