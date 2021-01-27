import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ElectionRevoke extends BaseCommand {
  static description = 'Revoke votes for a Validator Group in validator elections.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Voter's address" }),
    for: Flags.address({
      description: "ValidatorGroup's address",
      required: true,
    }),
    value: flags.string({ description: 'Value of votes to revoke', required: true }),
  }

  static examples = [
    'revoke --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b, --value 1000000',
  ]
  async run() {
    const res = this.parse(ElectionRevoke)

    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .isValidatorGroup(res.flags.for)
      .runChecks()

    const election = await this.kit.contracts.getElection()
    const accounts = await this.kit.contracts.getAccounts()
    const account = await accounts.voteSignerToAccount(res.flags.from)
    const txos = await election.revoke(account, res.flags.for, new BigNumber(res.flags.value))
    for (const txo of txos) {
      await displaySendTx('revoke', txo, { from: res.flags.from })
    }
  }
}
