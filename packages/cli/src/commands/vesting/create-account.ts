import { NULL_ADDRESS } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class CreateAccount extends BaseCommand {
  static description = 'Creates a new account for the vesting instance'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Beneficiary of the vesting ' }),
  }

  static args = []

  static examples = ['create-account --from 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    const res = this.parse(CreateAccount)
    this.kit.defaultAccount = res.flags.from
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingFactoryInstance = await vestingFactory.getVestedAt(res.flags.from)
    if (vestingFactoryInstance.address === NULL_ADDRESS) {
      console.error(`No vested instance found under the given beneficiary`)
      return
    }
    if ((await vestingFactoryInstance.getBeneficiary()) !== res.flags.from) {
      console.error(`Vested instance has a different beneficiary`)
      return
    }

    await newCheckBuilder(this)
      .isAccount(res.flags.from)
      .runChecks()

    let tx: any
    tx = await vestingFactoryInstance.createAccount()
    await displaySendTx('createaccountTx', tx)
  }
}
