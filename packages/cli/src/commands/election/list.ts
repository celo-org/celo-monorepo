import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class List extends BaseCommand {
  static description =
    'Prints the list of validator groups, the number of votes they have received, the number of additional votes they are able to receive, and whether or not they are eligible to elect validators.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  static examples = ['list']

  async run() {
    const res = this.parse(List)
    cli.action.start('Fetching validator group vote totals')
    const election = await this.kit.contracts.getElection()
    const groupVotes = await election.getValidatorGroupsVotes()
    cli.action.stop()
    cli.table(
      groupVotes,
      {
        address: {},
        name: {},
        votes: { get: (g) => g.votes.toFixed() },
        capacity: { get: (g) => g.capacity.toFixed() },
        eligible: {},
      },
      { 'no-truncate': !res.flags.truncate }
    )
  }
}
