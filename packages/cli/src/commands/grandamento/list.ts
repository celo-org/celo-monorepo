import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class List extends BaseCommand {
  static description = 'List current active Granda Mento exchange proposals'
  async run() {
    const grandaMento = await this.kit.contracts.getGrandaMento()
    const proposals = await grandaMento.getActiveProposalIds()

    console.log('Active proposals:')

    const proposalsDetails = proposals.map((id) => {
      // todo format this
      // console.log(id)
      return grandaMento.getExchangeProposal(id)
    })

    const res = await Promise.all(proposalsDetails)

    res.map((proposalJSON) => {
      console.log('Proposal ID: ' + proposalJSON.id)
      printValueMap(proposalJSON)
    })
  }
}
