import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMap } from '../../utils/cli'

export default class Propse extends BaseCommand {
  static description = 'Shows details of a Granda Mento exchange proposal'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({
      required: true,
      exclusive: ['account', 'hotfix'],
      description: 'UUID of proposal to view',
    }),
  }

  async run() {
    const grandaMento = await this.kit.contracts.getGrandaMento()

    const res = this.parse(Propse)
    const proposalID = res.flags.proposalID

    const proposal = await grandaMento.getExchangeProposal(proposalID)

    await newCheckBuilder(this).grandaMentoProposalExists(proposalID)

    printValueMap(proposal)
  }
}
