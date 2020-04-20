import { proposalToJSON } from '@celo/contractkit/lib/governance/proposals'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMapRecursive } from '../../utils/cli'

export default class View extends BaseCommand {
  static description = 'View governance proposal information from ID'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    proposalID: flags.string({ required: true, description: 'UUID of proposal to view' }),
    raw: flags.boolean({ required: false, description: 'Display proposal in raw bytes format' }),
  }

  static examples = ['view --proposalID 99', 'view --proposalID 99 --raw']

  async run() {
    const res = this.parse(View)
    const id = res.flags.proposalID
    const raw = res.flags.raw

    await newCheckBuilder(this)
      .proposalExists(id)
      .runChecks()

    const governance = await this.kit.contracts.getGovernance()
    const record = await governance.getProposalRecord(id)
    if (!raw) {
      try {
        const jsonproposal = await proposalToJSON(this.kit, record.proposal)
        record.proposal = jsonproposal as any
      } catch (error) {
        console.warn(`Could not decode proposal, displaying raw data: ${error}`)
      }
    }

    // Identify the transaction with the highest constitutional requirement.
    const proposal = await governance.getProposal(id)

    // Get the minimum participation and agreement required to pass a proposal.
    const participationParams = await governance.getParticipationParameters()
    const constitution = await governance.getConstitution(proposal)

    printValueMapRecursive({
      ...record,
      requirements: {
        participation: participationParams.baseline,
        agreement: constitution.times(100).toString() + '%',
      },
      isApproved: await governance.isApproved(id),
      isProposalPassing: await governance.isProposalPassing(id),
      secondsUntilStages: await governance.timeUntilStages(id),
    })
  }
}
