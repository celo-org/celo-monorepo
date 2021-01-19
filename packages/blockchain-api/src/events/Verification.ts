import { EventBuilder } from '../helpers/EventBuilder'
import { EventTypes } from '../schema'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'
import { Contracts } from '../utils'

export class Verification extends TransactionType {
  matches(transaction: Transaction): boolean {
    return (
      transaction.transfers.length === 1 &&
      transaction.transfers.containsTransferTo(Contracts.Attestations)
    )
  }

  getEvent(transaction: Transaction) {
    const transfer = transaction.transfers.getTransferTo(Contracts.Attestations)

    if (!transfer) {
      throw new Error('Transfer to Attestations not found.')
    }

    return EventBuilder.transferEvent(
      transaction,
      transfer,
      EventTypes.VERIFICATION_FEE,
      transfer.toAddressHash,
      transfer.toAccountHash,
      transaction.fees
    )
  }

  isAggregatable(): boolean {
    return false
  }
}
