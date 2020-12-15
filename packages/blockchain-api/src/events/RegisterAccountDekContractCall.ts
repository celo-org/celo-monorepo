import BigNumber from 'bignumber.js'
import { FeeType } from '../schema'
import { Fee, Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'

export class RegisterAccountDekContractCall extends TransactionType {
  matches(transaction: Transaction): boolean {
    return (
      transaction.transfers.isEmpty() &&
      transaction.input.registersAccountDek(this.context.userAddress)
    )
  }

  getEvent(transaction: Transaction) {
    return
  }

  isAggregatable(): boolean {
    return true
  }

  getFees(transaction: Transaction): Fee[] {
    if (transaction.fees.length === 0) {
      return []
    }

    // All fees for account DEK registration are considered to be a
    // one-time encryption fee attributed to the transaction that
    // caused it
    return [
      {
        type: FeeType.ONE_TIME_ENCRYPTION_FEE,
        value: transaction.fees.reduce(
          (accumulator, fee) => accumulator.plus(fee.value),
          new BigNumber(0)
        ),
        currencyCode: transaction.fees[0].currencyCode,
      },
    ]
  }
}
