import { NULL_ADDRESS } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class RefundFinalize extends BaseCommand {
  static description = 'Refund revoker and beneficiary after the vesting has been revoked'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Revoker of the vesting' }),
    beneficiary: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
  }

  static args = []

  static examples = [
    'refund-finalize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --beneficiary 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]

  async run() {
    const res = this.parse(RefundFinalize)
    const beneficiary = res.flags.beneficiary
    const revoker = res.flags.from
    this.kit.defaultAccount = revoker
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(beneficiary)

    await newCheckBuilder(this)
      .addCheck(
        `No vesting instance found under the given beneficiary ${beneficiary}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vesting instance has a different revoker`,
        async () => (await vestingInstance.getRevoker()) === revoker
      )
      .addCheck(
        `Vesting instance is not revoked yet`,
        async () => (await vestingInstance.isRevoked()) === true
      )
      .runChecks()

    const tx = await vestingInstance.refundAndFinalize()
    await displaySendTx('refundAndFinalizeTx', tx, { from: revoker })
  }
}
