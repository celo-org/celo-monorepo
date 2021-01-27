import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'
import { Contracts } from '../utils'

export class ExchangeContractCall extends TransactionType {
  matches(transaction: Transaction): boolean {
    return (
      transaction.transfers.isEmpty() && transaction.input.hasContractCallTo(Contracts.Exchange)
    )
  }

  getEvent(transaction: Transaction) {
    return
  }

  isAggregatable(): boolean {
    return true
  }
}
