import { cli } from 'cli-ux'
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
    const wrapper = await this.kit.contracts.getValidators()
    const vgroups = await wrapper.getRegisteredValidatorGroups()
    const votes = await wrapper.getValidatorGroupsVotes()
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
