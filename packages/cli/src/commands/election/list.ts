import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class List extends BaseCommand {
  static description =
    'Prints the list of validator groups, the number of votes they have received, the number of additional votes they are able to receive, and whether or not they are eleigible to elect validators.'

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
      votes: { get: (g) => g.votes.toFixed() },
      capacity: { get: (g) => g.capacity.toFixed() },
      eligible: {},
    })
  }
}
