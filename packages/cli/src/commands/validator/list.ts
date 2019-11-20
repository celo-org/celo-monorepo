import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class ValidatorList extends BaseCommand {
  static description = 'List registered Validators'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['list']

  async run() {
    this.parse(ValidatorList)

    cli.action.start('Fetching Validators')
    const validators = await this.kit.contracts.getValidators()
    const validatorList = await validators.getRegisteredValidators()

    cli.action.stop()
    cli.table(validatorList, {
      address: {},
      name: {},
      affiliation: {},
      score: {},
      ecdsaPublicKey: {},
      blsPublicKey: {},
    })
  }
}
