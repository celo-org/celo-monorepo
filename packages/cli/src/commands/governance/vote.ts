import { VoteValue } from '@celo/contractkit/lib/wrappers/Governance'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Vote extends BaseCommand {
  static description = 'Vote on an approved governance proposal'

  static voteOptions = ['Abstain', 'No', 'Yes']

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to vote on' }),
    vote: flags.enum({ options: Vote.voteOptions, required: true, description: 'Vote' }),
    from: Flags.address({ required: true, description: "Voter's address" }),
  }

  static examples = []

  async run() {
    const res = this.parse(Vote)

    const governance = await this.kit.contracts.getGovernance()

    const tx = await governance.vote(res.flags.proposalID, res.flags.vote as keyof typeof VoteValue)
    await displaySendTx('voteTx', tx, { from: res.flags.from })
  }
}
