import { EventBuilder } from '../helpers/EventBuilder'
import { EventTypes } from '../schema'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'

export class TokenReceived extends TransactionType {
  matches(transaction: Transaction): boolean {
    return (
      transaction.transfers.length === 1 &&
      transaction.transfers.containsTransferTo(this.context.userAddress)
    )
  }

  getEvent(transaction: Transaction) {
    const transfer = transaction.transfers.getTransferTo(this.context.userAddress)

    if (!transfer) {
      throw new Error('Transfer to the user not found.')
    }

    return EventBuilder.transferEvent(
      transaction,
      transfer,
      EventTypes.RECEIVED,
      transfer.fromAddressHash,
      transfer.fromAccountHash
    )
  }

  isAggregatable(): boolean {
    return false
  }
}
