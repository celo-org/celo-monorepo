import { NULL_ADDRESS } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class CreateAccount extends BaseCommand {
  static description = 'Creates a new account for the vesting instance'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
  }

  static args = []

  static examples = ['create-account --from 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    const res = this.parse(CreateAccount)
    this.kit.defaultAccount = res.flags.from
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(res.flags.from)

    await newCheckBuilder(this)
      .isNotAccount(vestingInstance.address)
      .addCheck(
        `No vested instance found under the given beneficiary ${res.flags.from}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vested instance has a different beneficiary`,
        async () => (await vestingInstance.getBeneficiary()) === res.flags.from
      )
      .runChecks()

    let tx: any
    tx = await vestingInstance.createAccount()
    await displaySendTx('createaccountTx', tx, { from: await vestingInstance.getBeneficiary() })
  }
}
