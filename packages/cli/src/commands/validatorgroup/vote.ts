import { flags } from '@oclif/command'
import { BondedDepositAdapter } from '../../adapters/bonded-deposit'
import { ValidatorsAdapter } from '../../adapters/validators'
import { BaseCommand } from '../../base'
import { displaySendTx, printValueMap } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorGroupVote extends BaseCommand {
  static description = 'Vote for a Validator Group'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Voter's address" }),
    current: flags.boolean({
      exclusive: ['revoke', 'for'],
      description: "Show voter's current vote",
    }),
    revoke: flags.boolean({
      exclusive: ['current', 'for'],
      description: "Revoke voter's current vote",
    }),
    for: Flags.address({
      exclusive: ['current', 'revoke'],
      description: "Set vote for ValidatorGroup's address",
    }),
  }

  static examples = [
    'vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b',
    'vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --revoke',
    'vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --current',
  ]
  async run() {
    const res = this.parse(ValidatorGroupVote)
    const vUtils = new ValidatorsAdapter(this.web3, res.flags.from)

    if (res.flags.current) {
      const bdUtils = new BondedDepositAdapter(this.web3)
      const details = await bdUtils.getVotingDetails(res.flags.from)
      const myVote = await vUtils.getVoteFrom(details.accountAddress)

      printValueMap({
        ...details,
        currentVote: myVote,
      })
    } else if (res.flags.revoke) {
      const tx = await vUtils.revokeVote()
      await displaySendTx('revokeVote', tx)
    } else if (res.flags.for) {
      const tx = await vUtils.vote(res.flags.for)
      await displaySendTx('vote', tx)
    } else {
      this.error('Use one of --for, --current, --revoke')
    }
  }
}
