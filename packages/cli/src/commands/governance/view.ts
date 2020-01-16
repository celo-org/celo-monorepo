import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMapRecursive } from '../../utils/cli'

export default class View extends BaseCommand {
  static description = 'View governance proposal information from ID'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to view' }),
  }

  static examples = ['view --proposalID 99']

  async run() {
    const res = this.parse(View)
    const id = res.flags.proposalID

    await newCheckBuilder(this)
      .proposalExists(id)
      .runChecks()

    const governance = await this.kit.contracts.getGovernance()
    const record = await governance.getProposalRecord(id)
    printValueMapRecursive(record)
  }
}
