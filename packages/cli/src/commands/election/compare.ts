import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class ElectionCompare extends BaseCommand {
  static description =
    'Runs a "mock" election and prints out the validators that would be elected if the epoch ended right now.'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    // const res = this.parse(ElectionCompare)
    cli.action.start('Running mock election')

    const accounts = await this.kit.contracts.getAccounts()
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()

    const groups = await election.getEligibleValidatorGroupsVotes()

    const elected = []

    for (const el of groups) {
      const group = await validators.getValidatorGroup(el.address, false)
      const votes = el.votes.shiftedBy(-18).toNumber()
      for (let i = 0; i < group.members.length; i++) {
        const member = group.members[i]
        const name = await accounts.getName(member)
        elected.push({ address: member, name, votes: votes / (i + 1) })
      }
    }

    cli.action.stop()

    const sorted = elected.sort((a, b) => b.votes - a.votes)

    for (let i = 0; i < sorted.length; i++) {
      console.log(i + 1, sorted[i].name, sorted[i].address, sorted[i].votes)
      if (i === 99) {
        console.log('-------------------------------------------------------------------')
      }
    }
  }
}
