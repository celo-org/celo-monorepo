import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class DeletePaymentDelegation extends BaseCommand {
  static description =
    "Removes a validator's payment delegation by setting benficiary and fraction to 0."

  static flags = {
    ...BaseCommand.flags,
    account: Flags.address({ required: true }),
  }

  static args = []

  static examples = [
    'delete-payment-delegation --account 0x5409ED021D9299bf6814279A6A1411A7e866A631',
  ]

  async run() {
    const res = this.parse(DeletePaymentDelegation)
    this.kit.defaultAccount = res.flags.account
    const accounts = await this.kit.contracts.getAccounts()

    await displaySendTx('deletePaymentDelegation', accounts.deletePaymentDelegation())

    console.log('Deleted payment delegation.')
  }
}
