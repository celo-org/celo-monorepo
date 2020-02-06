import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export const table = {
  index: {},
  votes: {},
  score: {},
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
    'at-block': flags.integer({
      description: 'block for which to run elections',
    }),
  }

  async run() {
    cli.action.start('Running mock election')
    const res = this.parse(ElectionCompare)

    const accounts = await this.kit._web3Contracts.getAccounts()
    const election = await this.kit._web3Contracts.getElection()
    const validators = await this.kit._web3Contracts.getValidators()
    const blockNumber = res.flags['at-block'] ?? (await this.web3.eth.getBlock('latest')).number

    const groups: string[] = await election.methods
      .getEligibleValidatorGroups()
      // @ts-ignore
      .call({}, blockNumber)

    const elected = []

    for (const el of groups) {
      // @ts-ignore
      const group = await validators.methods.getValidatorGroup(el).call({}, blockNumber)
      group.members = group[0]
      const groupName = await accounts.methods.getName(el).call()
      // @ts-ignore
      const rawVotes = await election.methods.getTotalVotesForGroup(el).call({}, blockNumber)
      const votes = new BigNumber(rawVotes).shiftedBy(-18).toNumber()
      for (let i = 0; i < group.members.length; i++) {
        const member = group.members[i]
        const name = await accounts.methods.getName(member).call()
        const score = '???'
        //          (await validators.getValidator(member)).score.multipliedBy(100).toFixed(1) + '%'
        elected.push({
          address: member,
          name,
          votes: Math.round(votes / (i + 1)),
          affiliation: el,
          groupName,
          score,
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
