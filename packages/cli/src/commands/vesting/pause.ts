import { NULL_ADDRESS } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Pause extends BaseCommand {
  static description = 'Pause the gold withdrawal of a vesting instance for a certain duration'

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
    const beneficiary = res.flags.beneficiary
    const revoker = res.flags.from
    this.kit.defaultAccount = revoker
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(beneficiary)

    const maxPausePeriod = parseInt(await vestingInstance.getMaxPausePeriod(), 10)

    await newCheckBuilder(this)
      .addCheck(
        `Pause duration must be greater than zero and less than the ${maxPausePeriod}`,
        () => res.flags.pauseduration > 0 && res.flags.pauseduration < maxPausePeriod
      )
      .addCheck(
        `No vesting instance found under the given beneficiary ${beneficiary}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vesting instance has a different revoker`,
        async () => (await vestingInstance.getRevoker()) === revoker
      )
      .addCheck(
        `Vesting instance is not revocable`,
        async () => (await vestingInstance.isRevokable()) === true
      )
      .runChecks()

    const tx = await vestingInstance.pauseVesting(res.flags.pauseduration)
    await displaySendTx('pauseVestingTx', tx, { from: revoker })
  }
}
