import { CeloTransactionObject } from '@celo/connect'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldBaseCommand } from '../../utils/release-gold-base'

export default class RevokeVotes extends ReleaseGoldBaseCommand {
  static description =
    "Revokes `votes` for the given contract's account from the given group's account"

  static flags = {
    ...ReleaseGoldBaseCommand.flags,
    group: Flags.address({
      required: false,
      exclusive: ['allGroups'],
      description: 'Address of the group to revoke votes from',
    }),
    votes: flags.string({
      required: false,
      exclusive: ['allVotes', 'allGroups'],
      description: 'The number of votes to revoke',
    }),
    allVotes: flags.boolean({
      required: false,
      exclusive: ['votes'],
      description: 'Revoke all votes',
    }),
    allGroups: flags.boolean({
      required: false,
      exclusive: ['group', 'votes'],
      description: 'Revoke all votes from all groups',
    }),
  }

  static examples = [
    'revoke-votes --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --group 0x5409ED021D9299bf6814279A6A1411A7e866A631 --votes 100',
    'revoke-votes --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --allVotes --allGroups',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(RevokeVotes)

    await newCheckBuilder(this).isAccount(this.releaseGoldWrapper.address).runChecks()

    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    const beneficiary = await this.releaseGoldWrapper.getBeneficiary()
    const releaseOwner = await this.releaseGoldWrapper.getReleaseOwner()

    this.kit.defaultAccount = isRevoked ? releaseOwner : beneficiary

    let txos: Array<CeloTransactionObject<void>>
    if (flags.allVotes && flags.allGroups) {
      txos = await this.releaseGoldWrapper.revokeAllVotesForAllGroups()
    } else if (flags.allVotes && flags.group) {
      txos = await this.releaseGoldWrapper.revokeAllVotesForGroup(flags.group)
    } else if (flags.votes && flags.group) {
      txos = await this.releaseGoldWrapper.revokeValueFromVotes(
        flags.group,
        new BigNumber(flags.votes)
      )
    } else {
      throw new Error(
        'Must provide --votes amount and --group address or --allVotes --allGroups flags'
      )
    }

    for (const txo of txos) {
      await displaySendTx('revokeVotes', txo)
    }
  }
}
