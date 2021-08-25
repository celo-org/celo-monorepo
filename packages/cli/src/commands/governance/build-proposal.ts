import {
  InteractiveProposalBuilder,
  ProposalBuilder,
  proposalToJSON,
  ProposalTransactionJSON,
} from '@celo/governance/lib/proposals'
import { flags } from '@oclif/command'
import { readJsonSync, writeFileSync } from 'fs-extra'
import { BaseCommand } from '../../base'
import { checkProposal } from '../../utils/governance'

export default class BuildProposal extends BaseCommand {
  static description = 'Interactively build a governance proposal'

  static flags = {
    ...BaseCommand.flags,
    output: flags.string({
      required: false,
      description: 'Path to output',
      default: 'proposalTransactions.json',
    }),
    afterExecutingProposal: flags.string({
      required: false,
      description: 'Path to proposal which will be executed prior to proposal being built',
      exclusive: ['afterExecutingID'],
    }),
    afterExecutingID: flags.string({
      required: false,
      description:
        'Governance proposal identifier which will be executed prior to proposal being built',
      exclusive: ['afterExecutingProposal'],
    }),
  }

  static examples = ['build-proposal --output ./transactions.json']

  async run() {
    const res = this.parse(BuildProposal)

    const builder = new ProposalBuilder(this.kit)

    if (res.flags.afterExecutingID || res.flags.afterExecutingProposal) {
      let preProposal: ProposalTransactionJSON[]
      if (res.flags.afterExecutingID) {
        const governance = await this.kit.contracts.getGovernance()
        const proposalRaw = await governance.getProposal(res.flags.afterExecutingID)
        preProposal = await proposalToJSON(this.kit, proposalRaw)
      } else {
        preProposal = readJsonSync(res.flags.afterExecutingProposal!)
      }

      // accounts for registry additions and caches in builder
      for (const tx of preProposal) {
        await builder.fromJsonTx(tx)
      }

      console.info(
        `After executing provided proposal, account for registry remappings: ${JSON.stringify(
          builder.registryAdditions,
          null,
          2
        )}`
      )
    }

    // TODO: optimize builder redundancies

    const promptBuilder = new InteractiveProposalBuilder(builder)
    const output = await promptBuilder.promptTransactions()
    console.info(`Outputting proposal to ${res.flags.output}`)
    writeFileSync(res.flags.output!, JSON.stringify(output))

    output.forEach((tx) => builder.addJsonTx(tx))
    const proposal = await builder.build()

    await checkProposal(proposal, this.kit)
  }
}
