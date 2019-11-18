import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorUpdateBlsPublicKey extends BaseCommand {
  static description = 'Update BLS key for a validator'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Validator's address" }),
    blsKey: Flags.blsPublicKey({ required: true }),
    blsPop: Flags.blsProofOfPossession({ required: true }),
  }

  static examples = [
    'update-bls-key --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --blsKey 0x9d3e1d8f49f6b0d8e9a03d80ca07b1d24cf1cc0557bdcc04f5e17a46e35d02d0d411d956dbd5d2d2464eebd7b74ae300 --blsPop 0x05d223780d785d2abc5644fac7ac29fb0e302bdc80c81a5d45018b68b1045068a4b3a4861c93037685fd0d252d7405011220a66a6257562d0c26dabf64485a1d96bad27bb1c0fd6080a75b0ec9f75b50298a2a8e04b02b2688c8104fca61fb00',
  ]
  async run() {
    const res = this.parse(ValidatorUpdateBlsPublicKey)
    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()
    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerAccountIsValidator()
      .runChecks()

    await displaySendTx(
      'updateBlsPublicKey',
      validators.updateBlsPublicKey(res.flags.blsKey as any, res.flags.blsPop as any)
    )
  }
}
