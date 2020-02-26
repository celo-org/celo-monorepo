// This file is a temporary solution to the backwards incompatibility
// of web3 types
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

export interface EventLog {
  event: string
  address: string
  returnValues: any
  logIndex: number
  transactionIndex: number
  transactionHash: string
  blockHash: string
  blockNumber: number
  raw?: { data: string; topics: string[] }
}

export interface EncodedTransaction {
  raw: string
  tx: {
    nonce: string
    gasPrice: string
    gas: string
    to: string
    value: string
    input: string
    v: string
    r: string
    s: string
    hash: string
  }
}

export interface Log {
  address: string
  data: string
  topics: string[]
  logIndex: number
  transactionHash: string
  transactionIndex: number
  blockHash: string
  blockNumber: number
}

export type Callback<T> = (error: Error | null, result?: T) => void
