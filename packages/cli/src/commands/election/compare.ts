import chalk from 'chalk'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export const table = {
  index: {},
  votes: {},
  name: {},
  address: {},
  groupName: {},
  affiliation: {},
}

export default class ElectionCompare extends BaseCommand {
  static description =
    'Runs a "mock" election and prints out the validators that would be elected if the epoch ended right now.'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    cli.action.start('Running mock election')

    const accounts = await this.kit.contracts.getAccounts()
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()

    const groups = await election.getEligibleValidatorGroupsVotes()

    const elected = []

    for (const el of groups) {
      const group = await validators.getValidatorGroup(el.address, false)
      const groupName = await accounts.getName(el.address)
      const votes = el.votes.shiftedBy(-18).toNumber()
      for (let i = 0; i < group.members.length; i++) {
        const member = group.members[i]
        const name = await accounts.getName(member)
        elected.push({
          address: member,
          name,
          votes: votes / (i + 1),
          affiliation: el.address,
          groupName,
        })
      }
    }

    cli.action.stop()

    const sorted = elected.sort((a, b) => b.votes - a.votes)

    cli.table(
      sorted.map((a, i) => ({ ...a, index: i < 100 ? i + 1 : chalk.gray((i + 1).toString()) })),
      table
    )
  }
}
