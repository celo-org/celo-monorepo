import { Transaction } from './Transaction'

export interface Context {
  userAddress: string
  token: string
}

export abstract class TransactionType {
  protected readonly context!: Context

  constructor(context: Context) {
    this.context = context
  }

  abstract matches(transaction: Transaction): boolean
  abstract getEvent(transaction: Transaction): any
  abstract isAggregatable(): boolean
}
