import { addressToPublicKey } from '@celo/utils/lib/signatureUtils'
import { flags } from '@oclif/command'
import humanizeDuration from 'humanize-duration'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { binaryPrompt, displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorRegister extends BaseCommand {
  static description = 'Register a new Validator'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address for the Validator' }),
    ecdsaKey: Flags.ecdsaPublicKey({ required: true }),
    blsKey: Flags.blsPublicKey({ required: true }),
    blsSignature: Flags.blsProofOfPossession({ required: true }),
    yes: flags.boolean({ description: 'Answer yes to prompt' }),
  }

  static examples = [
    'register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --ecdsaKey 0x049b7291ab8813a095d6b7913a7930ede5ea17466abd5e1a26c6c44f6df9a400a6f474080098b2c752c6c4871978ca977b90dcd3aed92bc9d564137c8dfa14ee72 --blsKey 0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00 --blsSignature 0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
  ]

  async run() {
    const res = this.parse(ValidatorRegister)

    const validators = await this.kit.contracts.getValidators()
    const accounts = await this.kit.contracts.getAccounts()

    if (!res.flags.yes) {
      const requirements = await validators.getValidatorLockedGoldRequirements()
      const duration = requirements.duration.toNumber() * 1000
      const check = await binaryPrompt(
        `This will lock ${requirements.value.shiftedBy(-18)} CELO for ${humanizeDuration(
          duration
        )}. Are you sure you want to continue?`,
        true
      )
      if (!check) {
        console.log('Cancelled')
        return
      }
    }

    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .isNotValidator()
      .isNotValidatorGroup()
      .signerMeetsValidatorBalanceRequirements()
      .runChecks()

    await displaySendTx(
      'registerValidator',
      validators.registerValidator(
        // @ts-ignore incorrect typing for bytes type
        res.flags.ecdsaKey,
        res.flags.blsKey,
        res.flags.blsSignature
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
