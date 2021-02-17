import { ClassifiedTransaction } from './TransactionClassifier'

/**
 * Aggregates transactions based on their type, summing up fees, grouping them into one
 * transaction meaningful for the end user.
 * Starting with the first transaction adds fees for contract calls to the previous
 * transaction of another type.
 */
export class TransactionAggregator {
  static aggregate(transactions: ClassifiedTransaction[]): ClassifiedTransaction[] {
    const aggregatedTransactions = transactions.reduce(
      TransactionAggregator.aggregateContractCallFees,
      []
    )

    return aggregatedTransactions.filter((t) => t)
  }

  static aggregateContractCallFees(
    accumulator: ClassifiedTransaction[],
    currentTransaction: ClassifiedTransaction,
    currentIndex: number,
    array: ClassifiedTransaction[]
  ): ClassifiedTransaction[] {
    if (currentTransaction.type.isAggregatable() && accumulator.length > 0) {
      const transactionFees = currentTransaction.type.getFees(currentTransaction.transaction)

      transactionFees.forEach((fee) => accumulator[accumulator.length - 1].transaction.addFee(fee))
    } else {
      accumulator.push(currentTransaction)
    }

    return accumulator
  }
}
