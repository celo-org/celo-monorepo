import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class RevokeUpvote extends BaseCommand {
  static description = 'Revoke upvotes for queued governance proposals'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Upvoter's address" }),
  }

  static examples = ['revokeupvote --from 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(RevokeUpvote)
    const signer = res.flags.from
    this.kit.defaultAccount = signer

    await newCheckBuilder(this, signer)
      .isVoteSignerOrAccount()
      .runChecks()

    // TODO(nategraf): Check whether there are upvotes to revoke before sending transaction.
    const governance = await this.kit.contracts.getGovernance()
    const account = await (await this.kit.contracts.getAccounts()).voteSignerToAccount(signer)
    await displaySendTx(
      'revokeUpvoteTx',
      await governance.revokeUpvote(account),
      {},
      'ProposalUpvoteRevoked'
    )
  }
}
