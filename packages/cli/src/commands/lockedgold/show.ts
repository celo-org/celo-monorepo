import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMapRecursive } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class Show extends BaseCommand {
  static description = 'Show Locked Gold information for a given account'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [Args.address('account')]

  static examples = ['show 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const { args } = this.parse(Show)

    const lockedGold = await this.kit.contracts.getLockedGold()

    await newCheckBuilder(this)
      .isAccount(args.account)
      .runChecks()

    printValueMapRecursive(await lockedGold.getAccountSummary(args.account))
  }
}
