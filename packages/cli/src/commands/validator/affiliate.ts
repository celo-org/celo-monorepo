import { IArg } from '@oclif/parser/lib/args'
import prompts from 'prompts'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Args, Flags } from '../../utils/command'

export default class ValidatorAffiliate extends BaseCommand {
  static description =
    "Affiliate a Validator with a Validator Group. This allows the Validator Group to add that Validator as a member. If the Validator is already a member of a Validator Group, affiliating with a different Group will remove the Validator from the first group's members."

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Signer or Validator's address" }),
  }

  static args: IArg[] = [
    Args.address('groupAddress', { description: "ValidatorGroup's address", required: true }),
  ]

  static examples = [
    'affiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 0x97f7333c51897469e8d98e7af8653aab468050a3',
  ]

  async run() {
    const res = this.parse(ValidatorAffiliate)
    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()

    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerAccountIsValidator()
      .isValidatorGroup(res.args.groupAddress)
      .runChecks()

    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message:
        'Are you sure you want to affiliate with this group?\nAffiliating with a Validator Group could result in Locked Gold requirements of up to 10,000 cGLD for 60 days. (y/n)',
    })

    if (!response.confirmation) {
      console.info('Aborting due to user response')
      process.exit(0)
    }
    await displaySendTx('affiliate', validators.affiliate(res.args.groupAddress))
  }
}
