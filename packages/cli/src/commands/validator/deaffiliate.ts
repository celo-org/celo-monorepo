import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorDeAffiliate extends BaseCommand {
  static description =
    'Deaffiliate a Validator from a Validator Group, and remove it from the Group if it is also a member.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Signer or Validator's address" }),
  }

  static examples = ['deaffiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95']

  async run() {
    const res = this.parse(ValidatorDeAffiliate)

    const validators = await this.kit.contracts.getValidators()

    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerAccountIsValidator()
      .runChecks()

    await displaySendTx('deaffiliate', validators.deaffiliate())
  }
}
