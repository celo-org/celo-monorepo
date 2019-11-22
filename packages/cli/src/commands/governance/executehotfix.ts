import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { buildProposalFromJsonFile } from '../../utils/governance'

export default class ExecuteHotfix extends BaseCommand {
  static description = 'Execute a governance hotfix prepared for the current epoch'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Executors's address" }),
    jsonTransactions: flags.string({ required: true, description: 'Path to json transactions' }),
  }

  static examples = []

  async run() {
    const res = this.parse(ExecuteHotfix)

    const governance = await this.kit.contracts.getGovernance()
    const hotfix = await buildProposalFromJsonFile(this.kit, res.flags.jsonTransactions)
    const tx = governance.executeHotfix(hotfix)
    await displaySendTx('executeHotfixTx', tx, { from: res.flags.from })
  }
}
