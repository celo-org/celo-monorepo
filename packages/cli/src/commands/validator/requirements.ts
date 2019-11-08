import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class ValidatorRequirements extends BaseCommand {
  static description = 'Get Requirements for Validators'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['requirements']

  async run() {
    this.parse(ValidatorRequirements)

    const validators = await this.kit.contracts.getValidators()

    const requirements = await validators.getValidatorLockedGoldRequirements()

    printValueMap(requirements)
  }
}
