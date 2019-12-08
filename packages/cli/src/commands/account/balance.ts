import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Args } from '../../utils/command'
import { ContractKit, CeloContract } from '@celo/contractkit'

/*
async function getBTUBalance(kit : ContractKit, address : string) {
  const goldToken = await kit.contracts.getGoldToken()
  const stableToken = await kit.contracts.getStableToken()
  const lockedGold = await kit.contracts.getLockedGold()
  const oracle = await kit.contracts.getSortedOracles()
  const goldBalance = await goldToken.balanceOf(address)
  const lockedBalance = await lockedGold.getAccountTotalLockedGold(address)
  const dollarBalance = await stableToken.balanceOf(address)
  const rate = await oracle.medianRate(CeloContract.StableToken)
  console.log(rate.rate.toString())
  return goldBalance.plus(lockedBalance).plus(dollarBalance.multipliedBy(rate.rate))
}
*/

export default class Balance extends BaseCommand {
  static description = 'View Celo Dollar and Gold balances for an address'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [Args.address('address')]

  static examples = ['balance 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const { args } = this.parse(Balance)

    const goldToken = await this.kit.contracts.getGoldToken()
    const stableToken = await this.kit.contracts.getStableToken()
    const balances = {
      goldBalance: await goldToken.balanceOf(args.address),
      dollarBalance: await stableToken.balanceOf(args.address),
      totalBalance: await this.kit.getTotalBalance(args.address),
    }
    console.log('All balances expressed in units of 10^-18.')
    printValueMap(balances)
  }
}
