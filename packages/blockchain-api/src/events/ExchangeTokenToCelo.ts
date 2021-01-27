import { EventBuilder } from '../helpers/EventBuilder'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'
import { Contracts } from '../utils'

export class ExchangeTokenToCelo extends TransactionType {
  matches(transaction: Transaction): boolean {
    return (
      transaction.transfers.length === 3 &&
      transaction.transfers.containsTransferFrom(Contracts.Reserve) &&
      transaction.transfers.containsTransferTo(Contracts.Exchange) &&
      transaction.transfers.containsBurnedTokenTransfer()
    )
  }

  getEvent(transaction: Transaction) {
    const inTransfer = transaction.transfers.getTransferTo(Contracts.Exchange)
    const outTransfer = transaction.transfers.getTransferFrom(Contracts.Reserve)

    if (!inTransfer) {
      throw new Error('Transfer to Exchange not found.')
    }

    if (!outTransfer) {
      throw new Error('Transfer from Reserve not found.')
    }

    return EventBuilder.exchangeEvent(
      transaction,
      inTransfer,
      outTransfer,
      this.context.token,
      transaction.fees
    )
  }

  isAggregatable(): boolean {
    return false
  }
}
