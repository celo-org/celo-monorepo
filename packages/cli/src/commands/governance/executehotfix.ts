import { proposalToHash } from '@celo/contractkit/lib/governance/proposals'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
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
    const account = res.flags.from
    const hotfix = await buildProposalFromJsonFile(this.kit, res.flags.jsonTransactions)
    const hash = proposalToHash(this.kit, hotfix)

    const governance = await this.kit.contracts.getGovernance()
    const record = await governance.getHotfixRecord(hash)

    await newCheckBuilder(this, account)
      .hotfixIsPassing(hash)
      .hotfixNotExecuted(hash)
      .addCheck(`Hotfix ${hash} is prepared for current epoch`, async () => {
        const validators = await this.kit.contracts.getValidators()
        const currentEpoch = await validators.getEpochNumber()
        return record.preparedEpoch.eq(currentEpoch)
      })
      .addCheck(`Hotfix ${hash} is approved`, () => record.approved)
      .runChecks()

    await displaySendTx('executeHotfixTx', governance.executeHotfix(hotfix))
  }
}
