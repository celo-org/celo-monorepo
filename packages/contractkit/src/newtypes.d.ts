// This file is a temporary solution to the backwards incompatibility
// of web3 types
import { TransactionResult, EventLog, EncodedTransaction, Log } from '@types/web3/types'

export { TransactionResult, EventLog, EncodedTransaction, Log }

export interface TransactionReceipt {
  status: boolean
  transactionHash: string
  transactionIndex: number
  blockHash: string
  blockNumber: number
  from: string
  to: string
  cumulativeGasUsed: number
  gasUsed: number
  events?: {
    [eventName: string]: EventLog
  }
  contractAddress?: string
  logs?: Log[]
  logsBloom?: string
}
