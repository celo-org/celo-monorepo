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
    from: Flags.address({ required: true, description: 'Revoker of the vesting ' }),
    beneficiary: Flags.address({ required: true, description: 'Beneficiary of the vesting ' }),
    pauseduration: flags.string({
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
    const vestingFactoryInstance = await vestingFactory.getVestedAt(res.flags.beneficiary)
    if (vestingFactoryInstance.address === NULL_ADDRESS) {
      console.error(`No vested instance found under the given beneficiary`)
      return
    }
    if ((await vestingFactoryInstance.getRevoker()) !== res.flags.from) {
      console.error(`Vested instance has a different revoker`)
      return
    }

    await newCheckBuilder(this)
      .isAccount(res.flags.from)
      .runChecks()

    await newCheckBuilder(this)
      .isAccount(vestingFactoryInstance.address)
      .runChecks()

    const tx = await vestingFactoryInstance.pauseVesting(res.flags.pauseduration)
    await displaySendTx('pauseVestingTx', tx)
  }
}
