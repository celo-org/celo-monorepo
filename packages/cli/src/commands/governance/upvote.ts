import { GovernanceWrapper } from '@celo/contractkit/src/wrappers/Governance'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import chalk from 'chalk'

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

    const consideredProposals = await this.dequeueAllPossibleProposals(governance as any)

    if (!consideredProposals.some((k) => k.id === id)) {
      await displaySendTx('upvoteTx', await governance.upvote(id, account), {}, 'ProposalUpvoted')
    } else {
      console.info(chalk.green('Proposal was dequeued, no need to upvote it.'))
    }
  }

  /**
   * Dequeues all possible proposals, returns the ones that were considered to be dequeued.
   */
  async dequeueAllPossibleProposals(governance: GovernanceWrapper) {
    const concurrentProposals = (await governance.concurrentProposals()).toNumber()
    const queue = await governance.getQueue()
    const originalLastDequeue = await governance.lastDequeue()

    let consideredProposals

    for (let index = 0; index < queue.length / concurrentProposals + 1; index++) {
      consideredProposals = (
        await Promise.all(
          queue
            .slice(0, concurrentProposals)
            .map((p) => p.proposalID)
            .map(async (id) => {
              const expired = await governance.isQueuedProposalExpired(id)
              return { id: id.toString(), expired }
            })
        )
      ).filter((k) => k.expired === false)

      await displaySendTx('dequeue', governance.dequeueProposalsIfReady(), {})
      if (originalLastDequeue !== (await governance.lastDequeue())) {
        break
      }
    }

    return consideredProposals ?? []
  }
}
