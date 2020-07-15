import {
  PromiEvent,
  RLPEncodedTransaction as web3RlpTx,
  Transaction as web3Tx,
  TransactionConfig as web3TxConfig,
  TransactionReceipt as web3TxReceipt,
} from 'web3-core'

interface CeloParams {
  feeCurrency: string
  gatewayFeeRecipient: string
  gatewayFee: string
}

// tx construction
export type TransactionConfig = web3TxConfig & Partial<CeloParams>
export type Tx = TransactionConfig
export interface CeloTransactionObject<T> {
  arguments: any[]
  call(tx?: Tx): Promise<T>
  send(tx?: Tx): PromiEvent<T>
  estimateGas(tx?: Tx): Promise<number>
  encodeABI(): string
}

// tx signing
export interface RLPEncodedTransaction extends web3RlpTx {
  raw: string
  tx: web3RlpTx['tx'] & CeloParams
}

// tx results
export type Transaction = web3Tx & CeloParams
export type TransactionReceipt = web3TxReceipt & CeloParams
