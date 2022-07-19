import { BaseCommand } from '../../base'

export default class DeletePaymentDelegation extends BaseCommand {
  static description =
    "Removes a validator's payment delegation by setting benficiary and fraction to 0."

  static examples = ['delete-payment-delegation']

  async run() {
    //const res = this.parse(DeletePaymentDelegation);
    const accounts = await this.kit.contracts.getAccounts()

    await accounts.deletePaymentDelegation()

    console.log('Deleted payment delegation.')
  }
}
