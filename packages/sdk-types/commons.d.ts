import { provider, Transaction, TransactionConfig, TransactionReceipt } from 'web3-core'
import WebCoreHelper from 'web3-core-helpers'

export type Address = string
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

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
}

export {
  BlockNumber,
  EventLog,
  PromiEvent,
  RLPEncodedTransaction as EncodedTransaction,
} from 'web3-core'
export { Block, BlockHeader } from 'web3-eth'
export { Contract, PastEventOptions } from 'web3-eth-contract'
export { AbiItem } from 'web3-utils'

export type CeloTxPending = Transaction & Partial<CeloParams>
export type CeloTxReceipt = TransactionReceipt & Partial<CeloParams>

export type Callback<T> = (error: Error | null, result?: T) => void

export interface JsonRpcResponse extends WebCoreHelper.JsonRpcResponse {
  error?: string | { message: string; code: number }
}

export interface JsonRpcPayload extends WebCoreHelper.JsonRpcPayload {}

export interface Provider extends provider {
  send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void
}
