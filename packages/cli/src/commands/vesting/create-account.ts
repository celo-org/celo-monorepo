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
    revoker: Flags.address({ required: true, description: 'Revoker of the vesting' }),
  }

  static args = []

  static examples = [
    'create-account --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --revoker 0x5409ED021D9299bf6814279A6A1411A7e866A631',
  ]

  async run() {
    const res = this.parse(CreateAccount)
    const beneficiary = res.flags.from
    const revoker = res.flags.revoker
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(beneficiary)

    await newCheckBuilder(this)
      .isNotAccount(vestingInstance.address)
      .addCheck(
        `No vesting instance found under the given beneficiary ${beneficiary}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vesting instance has a different beneficiary`,
        async () => (await vestingInstance.getBeneficiary()) === beneficiary
      )
      .addCheck(
        `Vesting instance has a different revoker`,
        async () => (await vestingInstance.getRevoker()) === revoker
      )
      .runChecks()

    const isRevoked = await vestingInstance.isRevoked()
    this.kit.defaultAccount = isRevoked ? revoker : beneficiary
    let tx: any
    tx = await vestingInstance.createAccount()
    await displaySendTx('createAccountTx', tx, { from: isRevoked ? revoker : beneficiary })
  }
}
