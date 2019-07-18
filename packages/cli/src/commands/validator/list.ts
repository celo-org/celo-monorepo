import { cli } from 'cli-ux'
import { ValidatorsAdapter } from '../../adapters/validators'
import { BaseCommand } from '../../base'

export default class ValidatorList extends BaseCommand {
  static description = 'List existing Validators'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['list']

  async run() {
    this.parse(ValidatorList)

    cli.action.start('Fetching Validators')
    const validators = await new ValidatorsAdapter(this.web3).getRegisteredValidators()

    cli.action.stop()
    cli.table(validators, {
      address: {},
      id: {},
      name: {},
      url: {},
      publicKey: {},
      affiliation: {},
    })
  }
}
