import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Upvote extends BaseCommand {
  static description = 'Upvote a queued governance proposal'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to upvote' }),
    from: Flags.address({ required: true, description: "Upvoter's address" }),
  }

  static examples = ['upvote --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Upvote)
    const signer = res.flags.from
    const id = res.flags.proposalID
    this.kit.defaultAccount = signer
    const governance = await this.kit.contracts.getGovernance()

    await newCheckBuilder(this, signer)
      .isVoteSignerOrAccount()
      .proposalExists(id)
      .proposalInStage(id, 'Queued')
      .runChecks()

    const account = await (await this.kit.contracts.getAccounts()).voteSignerToAccount(signer)
    await displaySendTx('upvoteTx', await governance.upvote(id, account), {}, 'ProposalUpvoted')
  }
}
