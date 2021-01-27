import { EventBuilder } from '../helpers/EventBuilder'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'
import { Contracts } from '../utils'

export class ExchangeCeloToToken extends TransactionType {
  matches(transaction: Transaction): boolean {
    return (
      transaction.transfers.length === 2 &&
      transaction.transfers.containsTransferTo(Contracts.Reserve) &&
      transaction.transfers.containsMintedTokenTransfer()
    )
  }

  getEvent(transaction: Transaction) {
    const inTransfer = transaction.transfers.getTransferTo(Contracts.Reserve)
    const outTransfer = transaction.transfers.getMintedTokenTransfer()

    if (!inTransfer) {
      throw new Error('Transfer to Reserve not found.')
    }

    if (!outTransfer) {
      throw new Error('Minted token transfer not found.')
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
