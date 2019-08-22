import { cli } from 'cli-ux'
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
    const wrapper = await this.kit.contracts.getValidators()
    const validators = await wrapper.getRegisteredValidators()

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
