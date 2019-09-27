import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorGroupRegister extends BaseCommand {
  static description = 'Register a new Validator Group'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address for the Validator Group' }),
    id: flags.string({ required: true }),
    name: flags.string({ required: true }),
    url: flags.string({ required: true }),
    noticePeriod: flags.string({
      required: true,
      description:
        'Notice period of the Locked Gold commitment. Specify multiple notice periods to use the sum of the commitments.',
      multiple: true,
    }),
  }

  static examples = [
    'register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --id myID --name myName --noticePeriod 5184000 --noticePeriod 5184001 --url "http://vgroup.com"',
  ]
  async run() {
    const res = this.parse(ValidatorGroupRegister)

    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()

    await displaySendTx(
      'registerValidatorGroup',
      validators.registerValidatorGroup(
        res.flags.id,
        res.flags.name,
        res.flags.url,
        res.flags.noticePeriod
      )
    )
  }
}
