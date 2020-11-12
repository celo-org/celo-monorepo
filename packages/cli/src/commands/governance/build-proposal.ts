import {
  InteractiveProposalBuilder,
  ProposalBuilder,
} from '@celo/contractkit/lib/governance/proposals'
import { flags } from '@oclif/command'
import { writeFileSync } from 'fs-extra'
import { BaseCommand } from '../../base'

export default class BuildProposal extends BaseCommand {
  static description = 'Interactively build a governance proposal'

  static flags = {
    ...BaseCommand.flags,
    jsonTransactions: flags.string({
      required: true,
      description: 'Path to json transactions (as input or as output when specifying --interactive',
    }),
  }

  static examples = ['build-proposal --jsonTransactions ./transactions.json']

  async run() {
    const res = this.parse(BuildProposal)

    const builder = new ProposalBuilder(this.kit)

    // TODO: optimize builder redundancies

    const promptBuilder = new InteractiveProposalBuilder(builder)
    const jsonTransactions = await promptBuilder.promptTransactions()
    console.info(`Outputting proposal to ${res.flags.jsonTransactions}`)
    writeFileSync(res.flags.jsonTransactions!, JSON.stringify(jsonTransactions))
  }
}
