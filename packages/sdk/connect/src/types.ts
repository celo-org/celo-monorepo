import { PromiEvent, Transaction, TransactionConfig, TransactionReceipt } from 'web3-core'
import { Contract } from 'web3-eth-contract'

export type Address = string

export interface CeloParams {
  feeCurrency: string
  gatewayFeeRecipient: string
  gatewayFee: string
}

export type CeloTx = TransactionConfig & Partial<CeloParams>

export interface CeloTxObject<T> {
  arguments: any[]
  call(tx?: CeloTx): Promise<T>
  send(tx?: CeloTx): PromiEvent<CeloTxReceipt>
  estimateGas(tx?: CeloTx): Promise<number>
  encodeABI(): string
  _parent: Contract
}

export { BlockNumber, EventLog, Log, PromiEvent, Sign } from 'web3-core'
export { Block, BlockHeader } from 'web3-eth'
export { Contract, ContractSendMethod, PastEventOptions } from 'web3-eth-contract'

export interface EncodedTransaction {
  raw: string
  tx: {
    nonce: string
    gasPrice: string
    gas: string
    feeCurrency: string
    gatewayFeeRecipient: string
    gatewayFee: string
    to: string
    value: string
    input: string
    r: string
    s: string
    v: string
    hash: string
  }
}

export type CeloTxPending = Transaction & Partial<CeloParams>
export type CeloTxReceipt = TransactionReceipt & Partial<CeloParams>

export type Callback<T> = (error: Error | null, result?: T) => void

export interface JsonRpcResponse {
  jsonrpc: string
  id: number
  result?: any
  error?: string | { message: string; code: number }
}

export interface JsonRpcPayload {
  jsonrpc: string
  method: string
  params: any[]
  id?: string | number
}

export interface Provider {
  send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void
}

export interface RLPEncodedTx {
  transaction: CeloTx
  rlpEncode: string
}
