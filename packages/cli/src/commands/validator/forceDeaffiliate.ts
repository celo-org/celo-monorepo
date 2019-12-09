import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorForceDeaffiliate extends BaseCommand {
  static description =
    'Force deaffiliate a Validator from a Validator Group, and remove it from the Group if it is also a member.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Initiator' }),
    validator: Flags.address({ required: true, description: "Validator's address" }),
  }

  static examples = [
    'forcedeaffiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --validator 0x...',
  ]

  async run() {
    const res = this.parse(ValidatorForceDeaffiliate)
    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()

    await newCheckBuilder(this, res.flags.validator)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerAccountIsValidator()
      .runChecks()

    await displaySendTx(
      'forcedeaffiliate',
      validators.forceDeaffiliateIfValidator(res.args.validator)
    )
  }
}
