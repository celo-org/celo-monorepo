import { addressToPublicKey } from '@celo/utils/lib/signatureUtils'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorRegister extends BaseCommand {
  static description = 'Register a new Validator'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address for the Validator' }),
    ecdsaKey: Flags.ecdsaPublicKey({ required: true }),
    blsKey: Flags.blsPublicKey({ required: true }),
    blsPop: Flags.blsProofOfPossession({ required: true }),
  }

  static examples = [
    'register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --ecdsaKey 0xc52f3fab06e22a54915a8765c4f6826090cfac5e40282b43844bf1c0df83aaa632e55b67869758f2291d1aabe0ebecc7cbf4236aaa45e3e0cfbf997eda082ae1 --blsKey 0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00 --blsPop 0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
  ]

  async run() {
    const res = this.parse(ValidatorRegister)
    this.kit.defaultAccount = res.flags.from

    const validators = await this.kit.contracts.getValidators()
    const accounts = await this.kit.contracts.getAccounts()

    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerMeetsValidatorBalanceRequirements()
      .runChecks()

    await displaySendTx(
      'registerValidator',
      validators.registerValidator(
        res.flags.ecdsaKey as any,
        res.flags.blsKey as any,
        res.flags.blsPop as any
      )
    )

    // register encryption key on accounts contract
    // TODO: Use a different key data encryption
    const pubKey = await addressToPublicKey(res.flags.from, this.web3.eth.sign)
    // TODO fix typing
    const setKeyTx = accounts.setAccountDataEncryptionKey(pubKey as any)
    await displaySendTx('Set encryption key', setKeyTx)
  }
}
