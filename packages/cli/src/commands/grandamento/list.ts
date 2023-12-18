import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class List extends BaseCommand {
  static description = 'List current active Granda Mento exchange proposals'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    const grandaMento = await this.kit.contracts.getGrandaMento()
    const proposals = await grandaMento.getActiveProposalIds()

    if (!proposals.length) {
      console.log('No active Granda Mento proposals')
      return
    }

    console.log('Active proposals:')

    const proposalsDetails = proposals.map((id) => grandaMento.getHumanReadableExchangeProposal(id))

    const res = await Promise.all(proposalsDetails)

    res.map((proposalJSON) => {
      console.log('Proposal ID: ' + proposalJSON.id)
      printValueMap(proposalJSON)
    })
  }
}
