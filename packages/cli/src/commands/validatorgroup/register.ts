import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorGroupRegister extends BaseCommand {
  static description = 'Register a new Validator Group'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address for the Validator Group' }),
    name: flags.string({ required: true }),
    commission: flags.string({ required: true }),
  }

  static examples = [
    'register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --name myName --commission 0.1',
  ]

  async run() {
    const res = this.parse(ValidatorGroupRegister)

    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()
    const tx = await validators.registerValidatorGroup(
      res.flags.name,
      new BigNumber(res.flags.commission)
    )
    await displaySendTx('registerValidatorGroup', tx)
  }
}
