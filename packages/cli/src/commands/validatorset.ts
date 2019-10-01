import { BaseCommand } from '../base'

export default class ValidatorSet extends BaseCommand {
  static description = 'Outputs the current validator set'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['validatorset']

  async run() {
    const validators = await this.kit.contracts.getValidators()
    const validatorSet = await validators.getValidatorSetAddresses()

    validatorSet.forEach((validator: string) => console.log(validator))
  }
}
