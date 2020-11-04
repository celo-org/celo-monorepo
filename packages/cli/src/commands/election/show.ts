import { flags } from '@oclif/command'
import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMapRecursive } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class ElectionShow extends BaseCommand {
  static description = 'Show election information about a voter or registered Validator Group'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    voter: flags.boolean({
      exclusive: ['group'],
      description: 'Show information about an account voting in Validator elections',
    }),
    group: flags.boolean({
      exclusive: ['voter'],
      description: 'Show information about a group running in Validator elections',
    }),
  }

  static args: IArg[] = [
    Args.address('address', { description: "Voter or Validator Groups's address" }),
  ]

  static examples = [
    'show 0x97f7333c51897469E8D98E7af8653aAb468050a3 --voter',
    'show 0x97f7333c51897469E8D98E7af8653aAb468050a3 --group',
  ]

  async run() {
    const res = this.parse(ElectionShow)
    const address = res.args.address
    const election = await this.kit.contracts.getElection()

    if (res.flags.group) {
      await newCheckBuilder(this)
        .isValidatorGroup(address)
        .runChecks()
      const groupVotes = await election.getValidatorGroupVotes(address)
      printValueMapRecursive(groupVotes)
    } else if (res.flags.voter) {
      await newCheckBuilder(this)
        .isAccount(address)
        .runChecks()
      const voter = await election.getVoter(address)
      printValueMapRecursive(voter)
    } else {
      throw Error('Must select --voter or --group')
    }
  }
}
