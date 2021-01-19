import { EventBuilder } from '../helpers/EventBuilder'
import { EventTypes } from '../schema'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'

export class Faucet extends TransactionType {
  matches(transaction: Transaction): boolean {
    return transaction.transfers.length === 1 && transaction.transfers.containsFaucetTransfer()
  }

  getEvent(transaction: Transaction) {
    const transfer = transaction.transfers.getFaucetTransfer()

    if (!transfer) {
      throw new Error('Transfer from faucet not found.')
    }

    return EventBuilder.transferEvent(
      transaction,
      transfer,
      EventTypes.FAUCET,
      transfer.fromAddressHash,
      transfer.fromAccountHash
    )
  }

  isAggregatable(): boolean {
    return false
  }
}
