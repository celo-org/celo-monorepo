import { newReleaseGold } from '@celo/contractkit/src/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/src/wrappers/ReleaseGold'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetLiquidityProvision extends BaseCommand {
  static description =
    'Set the liquidity provision to true, allowing the beneficiary to withdraw released gold.'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
  }

  static args = []

  static examples = [
    'set-liquidity-provision --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(SetLiquidityProvision)
    const contractAddress = flags.contract
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )

    await newCheckBuilder(this)
      .addCheck('The liquidity provision has not already been set', async () => {
        const liquidityProvisionMet = await releaseGoldWrapper.getLiquidityProvisionMet()
        return !liquidityProvisionMet
      })
      .runChecks()

    this.kit.defaultAccount = await releaseGoldWrapper.getReleaseOwner()
    await displaySendTx('setLiquidityProvision', await releaseGoldWrapper.setLiquidityProvision())
  }
}
