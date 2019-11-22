import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Upvote extends BaseCommand {
  static description = 'Upvote a queued governance proposal'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to upvote' }),
    from: Flags.address({ required: true, description: "Upvoter's address" }),
  }

  static examples = []

  async run() {
    const res = this.parse(Upvote)

    const governance = await this.kit.contracts.getGovernance()
    const tx = await governance.upvote(res.flags.proposalID, res.flags.from)
    await displaySendTx('upvoteTx', tx, { from: res.flags.from })
  }
}
