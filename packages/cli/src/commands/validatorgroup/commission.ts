import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorGroupCommission extends BaseCommand {
  static description = 'Update the commission for an existing validator group'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address for the Validator Group' }),
    commission: flags.string({ required: true }),
  }

  static examples = [
    'commission --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --commission 0.1',
  ]

  async run() {
    const res = this.parse(ValidatorGroupCommission)

    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()
    const commission = new BigNumber(res.flags.commission)

    await newCheckBuilder(this, res.flags.from)
      .addCheck('Commission is in range [0,1]', () => commission.gte(0) && commission.lte(1))
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .runChecks()

    const tx = await validators.updateCommission(commission)
    await displaySendTx('updateCommission', tx)
  }
}
