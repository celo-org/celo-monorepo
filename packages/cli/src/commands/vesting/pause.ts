import { NULL_ADDRESS } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Pause extends BaseCommand {
  static description = 'Pause the vesting for a certain duration'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Revoker of the vesting' }),
    beneficiary: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
    pauseduration: flags.integer({
      description: 'The duration of the pause period (in sec)',
      required: true,
    }),
  }

  static args = []

  static examples = [
    'pause --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --beneficiary 0x5409ED021D9299bf6814279A6A1411A7e866A631 --pauseduration 300',
  ]

  async run() {
    const res = this.parse(Pause)
    this.kit.defaultAccount = res.flags.from
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(res.flags.beneficiary)

    await newCheckBuilder(this)
      .addCheck(
        `Pause duration must be greater than zero ${res.flags.pauseduration}`,
        () => res.flags.pauseduration > 0
      )
      .addCheck(
        `No vested instance found under the given beneficiary ${res.flags.from}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vested instance has a different revoker`,
        async () => (await vestingInstance.getRevoker()) === res.flags.from
      )
      .runChecks()

    const tx = await vestingInstance.pauseVesting(res.flags.pauseduration)
    await displaySendTx('pauseVestingTx', tx, { from: await vestingInstance.getRevoker() })
  }
}
