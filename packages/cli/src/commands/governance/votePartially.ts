import { flags } from '@oclif/command'
import chalk from 'chalk'
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
    yes: flags.string({ description: 'Yes votes' }),
    no: flags.string({ description: 'No votes' }),
    abstain: flags.string({ description: 'Abstain votes' }),
    from: Flags.address({ required: true, description: "Voter's address" }),
  }

  static examples = [
    'vote-partially --proposalID 99 --yes 10 --no 20 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
  ]

  async run() {
    const res = this.parse(VotePartially)
    const signer = res.flags.from
    const id = res.flags.proposalID

    this.kit.defaultAccount = signer
    const governance = await this.kit.contracts.getGovernance()

    await newCheckBuilder(this, signer)
      .isVoteSignerOrAccount()
      .proposalExists(id)
      .proposalInStage(id, 'Referendum')
      .runChecks()

    if (res.flags.yes == null && res.flags.no == null && res.flags.abstain == null) {
      console.log(chalk.red.bold('At least one vote choice needs to be > 0.'))
      return
    }

    await displaySendTx(
      'voteTx',
      await governance.votePartially(
        id,
        res.flags.yes ?? 0,
        res.flags.no ?? 0,
        res.flags.abstain ?? 0
      ),
      {},
      'ProposalPartiallyVoted'
    )
  }
}
