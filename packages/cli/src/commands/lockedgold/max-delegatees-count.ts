import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class MaxDelegateesCount extends BaseCommand {
  static description = 'Returns the maximum number of delegates allowed per account.'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['max-delegatees-count']

  async run() {
    const lockedGold = await this.kit.contracts.getLockedGold()

    const res = {
      maxDelegateesCount: (await lockedGold.getMaxDelegateesCount()).toFixed(),
    }

    printValueMapRecursive(res)
  }
}
