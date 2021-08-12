import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMap } from '../../utils/cli'
import { Flags } from '../../utils/command'

// const stableTokenOptions = enumEntriesDupWithLowercase(Object.entries(StableToken))

export default class Propse extends BaseCommand {
  static description = 'Proposes a Granda Mento exchange Celo to Stable Token'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'The address with CELO to exchange' }),
    proposalID: flags.string({
      required: true,
      exclusive: ['account', 'hotfix'],
      description: 'UUID of proposal to view',
    }),
  }

  async run() {
    // const celoToken = await this.kit.contracts.getGoldToken()
    const grandaMento = await this.kit.contracts.getGrandaMento()

    const res = this.parse(Propse)
    const proposalID = res.flags.proposalID

    const proposal = await grandaMento.getExchangeProposal(proposalID)

    // TODO add checks (proposal exists)

    await newCheckBuilder(this).grandaMentoProposalExists(proposalID)

    printValueMap(proposal) // TODO This function should parse the token addresses
  }
}
