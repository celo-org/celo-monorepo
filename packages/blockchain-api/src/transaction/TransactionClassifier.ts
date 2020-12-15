import { Transaction } from './Transaction'
import { TransactionType } from './TransactionType'

export interface ClassifiedTransaction {
  transaction: Transaction
  type: TransactionType
}

export class TransactionClassifier {
  transactionTypes: TransactionType[] = []

  constructor(transactionTypes: TransactionType[]) {
    this.transactionTypes = transactionTypes
  }

  classify(transaction: Transaction): ClassifiedTransaction {
    for (const type of this.transactionTypes) {
      if (type.matches(transaction)) {
        return { transaction, type }
      }
    }

    throw new Error(`Unhandled tx type ${transaction.transactionHash}`)
  }
}
