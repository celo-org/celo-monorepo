import { VoteValue } from '@celo/contractkit/lib/wrappers/Governance'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class VotePartially extends BaseCommand {
  static description = 'Vote partially on an approved governance proposal'

  static voteOptions = ['Abstain', 'No', 'Yes']

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to vote on' }),
    values: flags.string({
      options: VotePartially.voteOptions,
      required: true,
      description: "Array of votes split by ','",
    }),
    weights: flags.string({ required: true, description: "Array of weights split by ','" }),
    from: Flags.address({ required: true, description: "Voter's address" }),
  }

  static examples = [
    'vote-partially --proposalID 99 --values Yes,No --weights 10,20 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
  ]

  async run() {
    const res = this.parse(VotePartially)
    const signer = res.flags.from
    const id = res.flags.proposalID
    const voteValues = res.flags.values.split(',').map((vote) => vote.trim()) as Array<
      keyof typeof VoteValue
    >
    const weightValues = res.flags.weights.split(',').map((number) => parseInt(number, 10))

    if (voteValues.length !== weightValues.length) {
      throw new Error('values and weights need to be of same length')
    }

    this.kit.defaultAccount = signer
    const governance = await this.kit.contracts.getGovernance()

    await newCheckBuilder(this, signer)
      .isVoteSignerOrAccount()
      .proposalExists(id)
      .proposalInStage(id, 'Referendum')
      .runChecks()

    await displaySendTx(
      'voteTx',
      await governance.votePartially(id, voteValues, weightValues),
      {},
      'ProposalPartiallyVoted'
    )
  }
}
