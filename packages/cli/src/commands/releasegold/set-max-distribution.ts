import { newReleaseGold } from '@celo/contractkit/src/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/src/wrappers/ReleaseGold'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetMaxDistribution extends BaseCommand {
  static description = 'Set the maximum distribution of gold for the given contract'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
    distributionRatio: flags.string({
      required: true,
      description:
        'Amount in range [0, 1000] (3 significant figures) indicating % of total balance available for distribution.',
    }),
  }

  static args = []

  static examples = [
    'set-max-distribution --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --distributionRatio 1000',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(SetMaxDistribution)
    const contractAddress = flags.contract
    const distributionRatio = Number(flags.distributionRatio)
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )

    await newCheckBuilder(this)
      .addCheck(
        'Distribution ratio must be within [0, 1000]',
        () => distributionRatio >= 0 && distributionRatio <= 1000
      )
      .runChecks()

    this.kit.defaultAccount = await releaseGoldWrapper.getReleaseOwner()
    await displaySendTx(
      'setMaxDistribution',
      releaseGoldWrapper.setMaxDistribution(distributionRatio)
    )
  }
}
