import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class Balance extends BaseCommand {
  static description = 'View Celo Dollar and Gold balances given account address'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [Args.address('account')]

  static examples = ['balance 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const { args } = this.parse(Balance)

    const goldToken = await this.kit.contracts.getGoldToken()
    const stableToken = await this.kit.contracts.getStableToken()
    const balances = {
      goldBalance: await goldToken.balanceOf(args.account),
      dollarBalance: await stableToken.balanceOf(args.account),
    }
    printValueMap(balances)
  }
}
