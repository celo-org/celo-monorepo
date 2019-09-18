import { BaseCommand } from '../base'

export default class ValidatorSet extends BaseCommand {
  static description = 'Outputs the current validator set'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['validatorset']

  async run() {
    const validators = await this.kit.contracts.getValidators()
    const numberValidators = await validators.numberValidatorsInCurrentSet()

    for (let i = 0; i < numberValidators; i++) {
      const validatorAddress = await validators.validatorAddressFromCurrentSet(i)
      console.log(validatorAddress)
    }
  }
}
