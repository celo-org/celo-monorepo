import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import cli from 'cli-ux'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorGroupRegister extends BaseCommand {
  static description = 'Register a new Validator Group'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address for the Validator Group' }),
    yes: flags.boolean({ description: 'Answer yes to prompt' }),
    commission: flags.string({
      required: true,
      description:
        'The share of the epoch rewards given to elected Validators that goes to the group.',
    }),
  }

  static examples = ['register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --commission 0.1']

  async run() {
    const res = this.parse(ValidatorGroupRegister)

    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()
    const commission = new BigNumber(res.flags.commission)

    const requirements = await validators.getValidatorLockedGoldRequirements()

    if (!res.flags.yes) {
      const check = await cli.prompt(
        `This will lock your gold for ${requirements.duration} blocks. Are you sure you want to continue? [yN]`,
        { required: false }
      )
      if (check !== 'y') {
        console.log('Cancelled')
        return
      }
    }

    await newCheckBuilder(this, res.flags.from)
      .addCheck('Commission is in range [0,1]', () => commission.gte(0) && commission.lte(1))
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .isNotValidator()
      .isNotValidatorGroup()
      .signerMeetsValidatorGroupBalanceRequirements()
      .runChecks()

    const tx = await validators.registerValidatorGroup(commission)
    await displaySendTx('registerValidatorGroup', tx)
  }
}
