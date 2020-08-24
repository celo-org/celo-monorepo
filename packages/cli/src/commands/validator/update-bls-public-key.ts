import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorUpdateBlsPublicKey extends BaseCommand {
  static description =
    'Update the BLS public key for a Validator to be used in consensus. Regular (ECDSA and BLS) key rotation is recommended for Validator operational security.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Validator's address" }),
    blsKey: Flags.blsPublicKey({ required: true }),
    blsPop: Flags.blsProofOfPossession({ required: true }),
  }

  static examples = [
    'update-bls-key --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --blsKey 0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00 --blsPop 0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
  ]
  async run() {
    const res = this.parse(ValidatorUpdateBlsPublicKey)

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
