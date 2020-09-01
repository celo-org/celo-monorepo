import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorGroupDeRegister extends BaseCommand {
  static description =
    'Deregister a Validator Group. Approximately 60 days after deregistration, the 10,000 Gold locked up to register the Validator Group will become possible to unlock. Note that the Group must be empty (i.e. no members) before deregistering.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Signer or ValidatorGroup's address" }),
  }

  static examples = ['deregister --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95']

  async run() {
    const res = this.parse(ValidatorGroupDeRegister)

    const validators = await this.kit.contracts.getValidators()

    const account = await validators.signerToAccount(res.flags.from)

    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerAccountIsValidatorGroup()
      .runChecks()

    await displaySendTx('deregister', await validators.deregisterValidatorGroup(account))
  }
}
