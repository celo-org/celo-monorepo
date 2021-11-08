import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Cancel extends BaseCommand {
  static description = 'Cancels a Granda Mento exchange proposal'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'The address allowed to cancel the proposal',
    }),
    proposalID: flags.string({
      required: true,
      exclusive: ['account', 'hotfix'],
      description: 'UUID of proposal to view',
    }),
  }

  async run() {
    const grandaMento = await this.kit.contracts.getGrandaMento()

    const res = this.parse(Cancel)
    const proposalID = res.flags.proposalID

    await newCheckBuilder(this).grandaMentoProposalExists(proposalID).runChecks()

    await displaySendTx(
      'cancelExchangeProposal',
      grandaMento.cancelExchangeProposal(proposalID),
      undefined,
      'ExchangeProposalCancelled'
    )
  }
}
