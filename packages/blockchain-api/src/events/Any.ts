import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'

export class Any extends TransactionType {
  matches(transaction: Transaction): boolean {
    return true
  }

  getEvent(transaction: Transaction) {
    throw new Error('Unknown transaction type')
  }

  isAggregatable(): boolean {
    return false
  }
}
