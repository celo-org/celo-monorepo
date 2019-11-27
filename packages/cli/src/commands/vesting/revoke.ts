import { NULL_ADDRESS } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Revoke extends BaseCommand {
  static description = 'Revoke the vesting for a certain duration'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Revoker of the vesting ' }),
    beneficiary: Flags.address({ required: true, description: 'Beneficiary of the vesting ' }),
    timestamp: flags.string({
      required: true,
      description: 'The timestamp at which to revoke the vesting ',
    }),
  }

  static args = []

  static examples = [
    'pause --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --beneficiary 0x5409ED021D9299bf6814279A6A1411A7e866A631 --pauseduration 300',
  ]

  async run() {
    const res = this.parse(Revoke)
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

    const tx = await vestingFactoryInstance.revokeVesting(res.flags.timestamp)
    await displaySendTx('revokeVestingTx', tx)
  }
}
