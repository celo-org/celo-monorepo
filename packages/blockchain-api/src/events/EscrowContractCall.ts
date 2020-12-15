import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'
import { Contracts } from '../utils'

export class EscrowContractCall extends TransactionType {
  matches(transaction: Transaction): boolean {
    return transaction.transfers.isEmpty() && transaction.input.hasContractCallTo(Contracts.Escrow)
  }

  getEvent(transaction: Transaction) {
    return
  }

  isAggregatable(): boolean {
    return true
  }
}
