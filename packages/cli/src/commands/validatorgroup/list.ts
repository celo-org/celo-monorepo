import { cli } from 'cli-ux'
import { ValidatorsAdapter } from '../../adapters/validators'
import { BaseCommand } from '../../base'

export default class ValidatorGroupList extends BaseCommand {
  static description = 'List existing Validator Groups'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['list']

  async run() {
    this.parse(ValidatorGroupList)

    cli.action.start('Fetching Validator Groups')
    const validatorsAdapter = new ValidatorsAdapter(this.web3)
    const vgroups = await validatorsAdapter.getRegisteredValidatorGroups()
    const votes = await validatorsAdapter.getValidatorGroupsVotes()
    cli.action.stop()

    cli.table(vgroups, {
      address: {},
      id: {},
      name: {},
      url: {},
      votes: { get: (r) => votes.find((v) => v.address === r.address)!.votes.toString() },
      members: { get: (r) => r.members.length },
    })
  }
}
