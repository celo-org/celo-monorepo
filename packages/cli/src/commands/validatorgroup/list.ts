import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class ValidatorGroupList extends BaseCommand {
  static description =
    'List registered Validator Groups, their names (if provided), commission, and members.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  static examples = ['list']

  async run() {
    const res = this.parse(ValidatorGroupList)

    cli.action.start('Fetching Validator Groups')
    const validators = await this.kit.contracts.getValidators()
    const vgroups = await validators.getRegisteredValidatorGroups()
    cli.action.stop()

    cli.table(
      vgroups,
      {
        address: {},
        name: {},
        commission: { get: (r) => r.commission.toFixed() },
        members: { get: (r) => r.members.length },
      },
      { 'no-truncate': !res.flags.truncate }
    )
  }
}
