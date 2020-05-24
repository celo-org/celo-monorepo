export interface Response<T> {
  status: string
  result: T[]
  message: string
}

export interface Transaction {
  value: string
  transactionIndex: string
  tokenSymbol?: string
  tokenName?: string
  tokenDecimal: string
  to: string
  timeStamp: string
  nonce: string
  input: string
  hash: string
  gasUsed: string
  gasPrice: string
  gas: string
  from: string
  cumulativeGasUsed: string
  contractAddress: string
  confirmations: string
  blockNumber: string
  blockHash: string
}

export interface Log {
  transactionIndex: string
  transactionHash: string
  topics: Array<string | null>
  timeStamp: string
  logIndex: string
  gasUsed: string
  gasPrice: string
  gatewayFee: string
  gatewayFeeRecipient: string | null
  feeCurrency: string | null
  data: string
  blockNumber: string
  address: string
}

export interface Transfer {
  recipient: string
  sender: string
  // ^ why recip./sender instead of to/from? from is a reserved keyword for notification data payloads
  value: string
  blockNumber: number
  txHash: string
  timestamp: number
  comment?: string
  currency?: Currencies
}
