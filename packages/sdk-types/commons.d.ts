import { provider, Transaction, TransactionConfig, TransactionReceipt } from 'web3-core'
import WebCoreHelper from 'web3-core-helpers'

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

export { EventLog, PromiEvent, RLPEncodedTransaction as EncodedTransaction } from 'web3-core'
export { Block, BlockHeader } from 'web3-eth'

export type CeloTxPending = Transaction & CeloParams
export type CeloTxReceipt = TransactionReceipt & CeloParams

export type Callback<T> = (error: Error | null, result?: T) => void

export interface JsonRpcResponse extends WebCoreHelper.JsonRpcResponse {
  error?: string | { message: string; code: number }
}

export interface JsonRpcPayload extends WebCoreHelper.JsonRpcPayload {}

export interface Provider extends provider {
  send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void
}
