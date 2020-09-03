import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorDeregister extends BaseCommand {
  static description =
    'Deregister a Validator. Approximately 60 days after deregistration, the 10,000 Gold locked up to register the Validator will become possible to unlock. Note that deregistering a Validator will also deaffiliate and remove the Validator from any Group it may be an affiliate or member of.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Signer or Validator's address" }),
  }

  static examples = ['deregister --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95']

  async run() {
    const res = this.parse(ValidatorDeregister)

    const validators = await this.kit.contracts.getValidators()

    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerAccountIsValidator()
      .isNotValidatorGroupMember()
      .validatorDeregisterDurationPassed()
      .runChecks()

    const validator = await validators.signerToAccount(res.flags.from)
    await displaySendTx('deregister', await validators.deregisterValidator(validator))
  }
}
