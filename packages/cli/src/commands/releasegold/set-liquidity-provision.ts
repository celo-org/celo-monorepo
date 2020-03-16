import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { ReleaseGoldCommand } from './release-gold'

export default class SetLiquidityProvision extends ReleaseGoldCommand {
  static description =
    'Set the liquidity provision to true, allowing the beneficiary to withdraw released gold.'

  static args = []

  static examples = [
    'set-liquidity-provision --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631',
  ]

  async run() {
    await newCheckBuilder(this)
      .addCheck('The liquidity provision has not already been set', async () => {
        const liquidityProvisionMet = await this.releaseGoldWrapper.getLiquidityProvisionMet()
        return !liquidityProvisionMet
      })
      .runChecks()

    this.kit.defaultAccount = await this.releaseGoldWrapper.getReleaseOwner()
    await displaySendTx('setLiquidityProvision', this.releaseGoldWrapper.setLiquidityProvision())
  }
}
