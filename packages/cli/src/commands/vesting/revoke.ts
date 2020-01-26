import { NULL_ADDRESS } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Revoke extends BaseCommand {
  static description = 'Revoke the vesting instance'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Revoker of the vesting' }),
    beneficiary: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
  }

  static args = []

  static examples = [
    'revoke --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --beneficiary 0x5409ED021D9299bf6814279A6A1411A7e866A631',
  ]

  async run() {
    const res = this.parse(Revoke)
    const beneficiary = res.flags.beneficiary
    const revoker = res.flags.from
    this.kit.defaultAccount = revoker
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(beneficiary)

    await newCheckBuilder(this)
      .addCheck(
        `No vested instance found under the given beneficiary ${beneficiary}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vested instance has a different revoker`,
        async () => (await vestingInstance.getRevoker()) === revoker
      )
      .addCheck(
        `Vesting instance is not revocable`,
        async () => (await vestingInstance.isRevokable()) === true
      )
      .runChecks()

    const tx = await vestingInstance.revokeVesting()
    await displaySendTx('revokeVestingTx', tx, { from: revoker })
  }
}
