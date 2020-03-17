import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldCommand } from './release-gold'

export default class RevokeVotes extends ReleaseGoldCommand {
  static description =
    "Revokes `votes` for the given contract's account from the given group's account"

  static flags = {
    ...ReleaseGoldCommand.flags,
    group: Flags.address({
      required: true,
      description: 'Address of the group to revoke votes from',
    }),
    votes: flags.string({ required: true, description: 'The number of votes to revoke' }),
  }

  static examples = [
    'revoke-votes --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --group 0x5409ED021D9299bf6814279A6A1411A7e866A631 --votes 100',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(RevokeVotes)

    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    const beneficiary = await this.releaseGoldWrapper.getBeneficiary()
    const releaseOwner = await this.releaseGoldWrapper.getReleaseOwner()
    const votes = new BigNumber(flags.votes)
    await newCheckBuilder(this)
      .isAccount(this.releaseGoldWrapper.address)
      .isValidatorGroup(flags.group)
      .runChecks()

    this.kit.defaultAccount = isRevoked ? releaseOwner : beneficiary
    const txos = await this.releaseGoldWrapper.revoke(
      this.releaseGoldWrapper.address,
      flags.group,
      votes
    )
    for (const txo of txos) {
      await displaySendTx('revoke', txo)
    }
  }
}
