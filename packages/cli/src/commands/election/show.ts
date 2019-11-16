import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMap } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class ElectionShow extends BaseCommand {
  static description = 'Show election information about an existing Validator Group'

  static flags = {
    ...BaseCommand.flags,
  }

  static args: IArg[] = [
    Args.address('groupAddress', { description: "Validator Groups's address" }),
  ]

  static examples = ['show 0x97f7333c51897469E8D98E7af8653aAb468050a3']

  async run() {
    const { args } = this.parse(ElectionShow)
    const address = args.groupAddress
    const election = await this.kit.contracts.getElection()

    await newCheckBuilder(this)
      .isValidatorGroup(address)
      .runChecks()

    const groupVotes = await election.getValidatorGroupVotes(address)
    printValueMap(groupVotes)
  }
}
