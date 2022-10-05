import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Execute extends BaseCommand {
  static description = 'Executes a Granda Mento exchange proposal'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'The address to execute the exchange proposal',
    }),
    proposalID: flags.string({
      required: true,
      description: 'UUID of proposal to view',
    }),
  }

  async run() {
    const grandaMento = await this.kit.contracts.getGrandaMento()

    const res = this.parse(Execute)
    const proposalID = res.flags.proposalID

    await newCheckBuilder(this)
      .grandaMentoProposalExists(proposalID)
      .grandaMentoProposalIsExecutable(proposalID)
      .runChecks()

    await displaySendTx(
      'executeExchangeProposal',
      grandaMento.executeExchangeProposal(proposalID),
      undefined,
      'ExchangeProposalExecuted'
    )
  }
}
