import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldCommand } from './release-gold'

export default class RevokeVotes extends ReleaseGoldCommand {
  static description = "Revokes votes for the given contract's account"

  static flags = {
    ...ReleaseGoldCommand.flags,
    type: flags.string({
      char: 'a',
      options: ['active', 'pending'],
      description: 'Type of votes to revoke [active, pending]',
      required: true,
    }),
    group: Flags.address({
      required: true,
      description: 'Address of the group to revoke votes from',
    }),
    votes: flags.string({ required: true, description: 'The number of votes to revoke' }),
  }

  static examples = [
    'revoke-votes --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --type pending --group 0x5409ED021D9299bf6814279A6A1411A7e866A631 --votes 100',
    'revoke-votes --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --type active --group 0x5409ED021D9299bf6814279A6A1411A7e866A631 --votes 100',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(RevokeVotes)

    let tx: any
    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    const beneficiary = await this.releaseGoldWrapper.getBeneficiary()
    const releaseOwner = await this.releaseGoldWrapper.getReleaseOwner()
    const votes = new BigNumber(flags.votes)
    const checkBuilder = newCheckBuilder(this)
      .isAccount(this.releaseGoldWrapper.address)
      .isValidatorGroup(flags.group)

    const election = await this.kit.contracts.getElection()
    const votesForGroup = await election.getVotesForGroupByAccount(
      this.releaseGoldWrapper.address,
      flags.group
    )
    await checkBuilder
      .addCheck('Vote value is valid', async () => {
        let relevantVotes = votesForGroup.pending
        if (flags.type === 'active') relevantVotes = votesForGroup.active
        return votes.gt(0) && relevantVotes.gte(votes)
      })
      .runChecks()
    if (flags.type === 'pending') {
      this.kit.defaultAccount = isRevoked ? releaseOwner : beneficiary
      tx = await this.releaseGoldWrapper.revokePending(
        this.releaseGoldWrapper.address,
        flags.group,
        votes
      )
    } else if (flags.type === 'active') {
      this.kit.defaultAccount = isRevoked ? releaseOwner : beneficiary
      tx = await this.releaseGoldWrapper.revokeActive(
        this.releaseGoldWrapper.address,
        flags.group,
        votes
      )
    } else {
      return this.error('Invalid action provided')
    }

    await displaySendTx('revoke' + flags.type + 'VotesTx', tx)
  }
}
