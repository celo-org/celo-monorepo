import { flags } from '@oclif/command'
import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Args, Flags } from '../../utils/command'

export default class ValidatorGroupMembers extends BaseCommand {
  static description = 'Add or remove members from a Validator Group'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "ValidatorGroup's address" }),
    accept: flags.boolean({
      exclusive: ['remove', 'reorder'],
      description: 'Accept a validator whose affiliation is already set to the group',
    }),
    remove: flags.boolean({
      exclusive: ['accept', 'reorder'],
      description: 'Remove a validator from the members list',
    }),
    reorder: flags.integer({
      exclusive: ['accept', 'remove'],
      description: 'Reorder a validator within the members list',
    }),
  }

  static args: IArg[] = [Args.address('validatorAddress', { description: "Validator's address" })]

  static examples = [
    'member --accept 0x97f7333c51897469e8d98e7af8653aab468050a3 ',
    'member --remove 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95',
    'member --reorder 3 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95',
  ]

  async run() {
    const res = this.parse(ValidatorGroupMembers)

    if (!(res.flags.accept || res.flags.remove || res.flags.reorder)) {
      this.error(`Specify action: --accept, --remove or --reorder`)
      return
    }

    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()
    const election = await this.kit.contracts.getElection()

    if (res.flags.accept) {
      await displaySendTx('addMember', validators.addMember((res.args as any).validatorAddress))
      if ((await validators.getGroupNumMembers(res.flags.from)).isEqualTo(1)) {
        const tx = await election.markGroupEligible(res.flags.from)
        await displaySendTx('markGroupEligible', tx)
      }
    } else if (res.flags.remove) {
      await displaySendTx(
        'removeMember',
        validators.removeMember((res.args as any).validatorAddress)
      )
    } else if (res.flags.reorder != null) {
      await displaySendTx(
        'reorderMember',
        await validators.reorderMember(
          res.flags.from,
          (res.args as any).validatorAddress,
          res.flags.reorder
        )
      )
    }
  }
}
