import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class ReserveStatus extends BaseCommand {
  static description = 'Shows information about reserve'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  static examples = ['status']

  async run() {
    const stableToken = await this.kit.contracts.getStableToken()
    const balances = await stableToken.getAccountBalances()
    printValueMapRecursive(balances)
  }
}
