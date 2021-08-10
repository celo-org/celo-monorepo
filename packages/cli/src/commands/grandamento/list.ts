import { BaseCommand } from '../../base'

export default class List extends BaseCommand {
  static description = 'List current active Granda Mento exchange proposals'
  async run() {
    const grandaMento = await this.kit.contracts.getGrandaMento()
    const proposals = await grandaMento.getActiveProposalIds()

    console.log('Active proposals:')
    proposals.map((id) => {
      console.log(id)
    })
  }
}
