import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ElectionVote extends BaseCommand {
  static description = 'Vote for a Validator Group in validator elections.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Voter's address" }),
    for: Flags.address({
      description: "ValidatorGroup's address",
      required: true,
    }),
    value: flags.string({ description: 'Amount of Gold used to vote for group', required: true }),
  }

  static examples = [
    'vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b, --value 1000000',
  ]
  async run() {
    const res = this.parse(ElectionVote)
    const value = new BigNumber(res.flags.value)

    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .isValidatorGroup(res.flags.for)
      .hasEnoughNonvotingLockedGold(value)
      .runChecks()

    const election = await this.kit.contracts.getElection()
    const tx = await election.vote(res.flags.for, value)
    await displaySendTx('vote', tx)
  }
}
