import { BaseCommand } from '../../base'
import { StableToken } from '../../generated/contracts'
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

    const stableToken = await StableToken(this.web3)
    const balances = {
      goldBalance: await this.web3.eth.getBalance(args.account),
      dollarBalance: await stableToken.methods.balanceOf(args.account).call(),
    }
    printValueMap(balances)
  }
}
