import { valueToFixidityString } from '@celo/contractkit/src/wrappers/BaseWrapper'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetPaymentDelegation extends BaseCommand {
  static description =
    "Sets a payment delegation beneficiary, an account address to receive a fraction of the validator's payment every epoch. The fraction is given as FixidityLib value and must not be greater than 1."

  static flags = {
    ...BaseCommand.flags,
    beneficiary: Flags.address({ required: true }),
    fraction: flags.string({ required: true }),
  }

  static args = []

  static examples = [
    'set-payment-delegation --beneficiary 0x5409ed021d9299bf6814279a6a1411a7e866a631 --fraction 0.1',
  ]

  async run() {
    const res = this.parse(SetPaymentDelegation)
    this.kit.defaultAccount = res.flags.beneficiary
    const accounts = await this.kit.contracts.getAccounts()

    await newCheckBuilder(this).isAccount(res.flags.beneficiary).runChecks()
    await displaySendTx(
      'setPaymentDelegation',
      accounts.setPaymentDelgation(res.flags.beneficiary, valueToFixidityString(res.flags.fraction))
    )
  }
}
