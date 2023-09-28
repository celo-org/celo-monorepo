import {
  AccessList,
  PromiEvent,
  Transaction,
  TransactionConfig,
  TransactionReceipt,
} from 'web3-core'
import { Contract } from 'web3-eth-contract'
export type Address = string

export type Hex = `0x${string}`
export interface CeloParams {
  feeCurrency: string
  /*
  @deprecated
  */
  gatewayFeeRecipient: string
  /*
  @deprecated
  */
  gatewayFee: string
}

export type AccessListRaw = Array<[string, string[]]>

export type HexOrMissing = Hex | undefined
export interface FormattedCeloTx {
  chainId: number
  from: HexOrMissing
  to: HexOrMissing
  data: string | undefined
  value: HexOrMissing
  feeCurrency?: HexOrMissing
  /*
  @deprecated
  */
  gatewayFeeRecipient?: HexOrMissing
  /*
  @deprecated
  */
  gatewayFee?: HexOrMissing
  gas: HexOrMissing
  gasPrice?: Hex
  maxFeePerGas?: Hex
  maxPriorityFeePerGas?: Hex
  nonce: HexOrMissing | number
  accessList?: AccessListRaw
  type: TransactionTypes
}

export type CeloTx = TransactionConfig &
  Partial<CeloParams> & { accessList?: AccessList; type?: TransactionTypes }

export type CeloTxWithSig = CeloTx & { v: number; s: string; r: string; yParity: 0 | 1 }
export interface CeloTxObject<T> {
  arguments: any[]
  call(tx?: CeloTx): Promise<T>
  send(tx?: CeloTx): PromiEvent<CeloTxReceipt>
  estimateGas(tx?: CeloTx): Promise<number>
  encodeABI(): string
  _parent: Contract
}

export { BlockNumber, EventLog, Log, PromiEvent, Sign } from 'web3-core'
export { Block, BlockHeader, Syncing } from 'web3-eth'
export { Contract, ContractSendMethod, PastEventOptions } from 'web3-eth-contract'

export type TransactionTypes = 'eip1559' | 'celo-legacy' | 'cip42' | 'cip64'

interface CommonTXProperties {
  nonce: string
  gas: string
  to: string
  value: string
  input: string
  r: string
  s: string
  v: string
  hash: string
  type: TransactionTypes
}

interface FeeMarketAndAccessListTXProperties extends CommonTXProperties {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  accessList?: AccessList
}

export interface EIP1559TXProperties extends FeeMarketAndAccessListTXProperties {
  type: 'eip1559'
}

export interface CIP64TXProperties extends FeeMarketAndAccessListTXProperties {
  feeCurrency: string
  type: 'cip64'
}

export interface CIP42TXProperties extends FeeMarketAndAccessListTXProperties {
  feeCurrency: string
  gatewayFeeRecipient?: string
  gatewayFee?: string
  type: 'cip42'
}

/*
  @deprecated
  */
export interface LegacyTXProperties extends CommonTXProperties {
  gasPrice: string
  feeCurrency: string
  gatewayFeeRecipient: string
  gatewayFee: string
  type: 'celo-legacy'
}

export interface EncodedTransaction {
  raw: Hex
  tx: LegacyTXProperties | CIP42TXProperties | EIP1559TXProperties | CIP64TXProperties
}

export type CeloTxPending = Transaction & Partial<CeloParams>
export type CeloTxReceipt = TransactionReceipt & Partial<CeloParams>

export type Callback<T> = (error: Error | null, result?: T) => void

export interface JsonRpcResponse {
  jsonrpc: string
  id: string | number
  result?: any
  error?: {
    readonly code?: number
    readonly data?: unknown
    readonly message: string
  }
}

export interface JsonRpcPayload {
  jsonrpc: string
  method: string
  params: any[]
  id?: string | number
}

export interface Provider {
  send(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): void
}

export interface Error {
  readonly code?: number
  readonly data?: unknown
  readonly message: string
}

export interface HttpProvider {
  send(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): void
}

export interface RLPEncodedTx {
  transaction: FormattedCeloTx
  rlpEncode: Hex
  type: TransactionTypes
}
