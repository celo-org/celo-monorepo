import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ValidatorGroupCommission extends BaseCommand {
  static description =
    'Manage the commission for a registered Validator Group. This represents the share of the epoch rewards given to elected Validators that goes to the group they are a member of. Updates must be made in a two step process where the group owner first calls uses the queue-update option, then after the required update delay, the apply option. The commission update delay, in blocks, can be viewed with the network:parameters command. A groups next commission update block can be checked with validatorgroup:show'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'Address for the Validator Group or Validator Group validator signer',
    }),
    apply: flags.boolean({
      exclusive: ['queue-update'],
      description: 'Applies a previously queued update. Should be called after the update delay.',
    }),
    'queue-update': flags.string({
      exclusive: ['apply'],
      description:
        'Queues an update to the commission, which can be applied after the update delay.',
    }),
  }

  static examples = [
    'commission --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --queue-update 0.1',
    'commission --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --apply',
  ]

  async run() {
    const res = this.parse(ValidatorGroupCommission)

    if (!(res.flags['queue-update'] || res.flags.apply)) {
      this.error(`Specify action: --apply or --queue-update`)
      return
    }

    this.kit.defaultAccount = res.flags.from
    const validators = await this.kit.contracts.getValidators()

    if (res.flags['queue-update']) {
      const commission = new BigNumber(res.flags['queue-update'])
      await newCheckBuilder(this, res.flags.from)
        .addCheck('Commission is in range [0,1]', () => commission.gte(0) && commission.lte(1))
        .isSignerOrAccount()
        .canSignValidatorTxs()
        // .signerAccountIsValidatorGroup()
        .runChecks()

      const tx = await validators.setNextCommissionUpdate(commission)
      await displaySendTx('setNextCommissionUpdate', tx)
    } else if (res.flags.apply) {
      await newCheckBuilder(this, res.flags.from)
        .isSignerOrAccount()
        .canSignValidatorTxs()
        // .signerAccountIsValidatorGroup()
        .hasACommissionUpdateQueued()
        .hasCommissionUpdateDelayPassed()
        .runChecks()

      const tx = await validators.updateCommission()
      await displaySendTx('updateCommission', tx)
    }
  }
}
