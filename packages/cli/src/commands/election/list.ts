import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class List extends BaseCommand {
  static description = 'Outputs the validator groups and their vote totals'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['list']

  async run() {
    cli.action.start('Fetching validator group vote totals')
    const election = await this.kit.contracts.getElection()
    const groupVotes = await election.getValidatorGroupsVotes()
    cli.action.stop()
    cli.table(groupVotes, {
      address: {},
      votes: {},
      capacity: {},
      eligible: {},
    })
  }
}
