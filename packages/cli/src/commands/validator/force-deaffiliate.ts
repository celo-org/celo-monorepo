import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorForceDeaffiliate extends BaseCommand {
  static description =
    "Force deaffiliate a Validator from a Validator Group, and remove it from the Group if it is also a member.  Used by stake-off admins in order to remove validators from the next epoch's validator set if they are down and consistently unresponsive, in order to preserve the health of the network. This feature will be removed once slashing for downtime is implemented."

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Initiator' }),
    validator: Flags.address({ required: true, description: "Validator's address" }),
  }

  static examples = [
    'force-deaffiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --validator 0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD',
  ]

  async run() {
    const res = this.parse(ValidatorForceDeaffiliate)

    const validators = await this.kit.contracts.getValidators()

    await newCheckBuilder(this, res.flags.validator)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerAccountIsValidator()
      .runChecks()

    await displaySendTx(
      'force-deaffiliate',
      validators.forceDeaffiliateIfValidator(res.flags.validator)
    )
  }
}
