import { EventBuilder } from '../helpers/EventBuilder'
import { EventTypes } from '../schema'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'
import { Contracts } from '../utils'

export class EscrowSent extends TransactionType {
  matches(transaction: Transaction): boolean {
    return (
      transaction.transfers.length === 1 &&
      transaction.transfers.containsTransferTo(Contracts.Escrow)
    )
  }

  getEvent(transaction: Transaction) {
    const transfer = transaction.transfers.getTransferTo(Contracts.Escrow)

    if (!transfer) {
      throw new Error('Transfer to Escrow not found.')
    }

    return EventBuilder.transferEvent(
      transaction,
      transfer,
      EventTypes.ESCROW_SENT,
      transfer.toAddressHash,
      transfer.toAccountHash,
      transaction.fees
    )
  }

  isAggregatable(): boolean {
    return false
  }
}
