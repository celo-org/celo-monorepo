import { flags } from '@oclif/command'
import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Args, Flags } from '../../utils/command'

export default class ValidatorGroupRegister extends BaseCommand {
  static description = 'Manage members of a Validator Group'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "ValidatorGroup's address" }),
    accept: flags.boolean({
      exclusive: ['remove'],
      description: 'Accept a validator whose affiliation is already set to the group',
    }),
    remove: flags.boolean({
      exclusive: ['accept'],
      description: 'Remove a validator from the members list',
    }),
  }

  static args: IArg[] = [Args.address('validatorAddress', { description: "Validator's address" })]

  static examples = [
    'member --accept 0x97f7333c51897469e8d98e7af8653aab468050a3 ',
    'member --remove 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95',
  ]

  async run() {
    const res = this.parse(ValidatorGroupRegister)

    if (!(res.flags.accept || res.flags.remove)) {
      this.error(`Specify action: --accept or --remove`)
      return
    }

    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()

    if (res.flags.accept) {
      await displaySendTx('addMember', validators.addMember((res.args as any).validatorAddress))
    } else {
      await displaySendTx('addMember', validators.removeMember((res.args as any).validatorAddress))
    }
  }
}
