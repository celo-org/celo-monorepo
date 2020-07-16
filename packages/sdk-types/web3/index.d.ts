import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import {
  RLPEncodedTransaction as web3rlptx,
  Transaction as web3tx,
  TransactionConfig as web3txconfig,
  TransactionReceipt as web3txreceipt,
} from 'web3-core'

export interface CeloParams {
  feeCurrency: string
  gatewayFeeRecipient: string
  gatewayFee: string
}

type Transaction = web3tx & CeloParams
type TransactionReceipt = web3txreceipt & CeloParams

declare module 'web3-core' {
  export type Tx = web3txconfig & Partial<CeloParams>
  export interface RlpEncodedTx extends web3rlptx {
    raw: string
    tx: web3rlptx['tx'] & CeloParams
  }
}

declare module 'web3-eth' {
  import { PromiEvent, Tx } from 'web3-core'

  export interface CeloTransactionObject<T> {
    arguments: any[]
    call(tx?: Tx): Promise<T>
    send(tx?: Tx): PromiEvent<T>
    estimateGas(tx?: Tx): Promise<number>
    encodeABI(): string
  }

  export type BlockType = string | number | BN | BigNumber | 'latest' | 'pending' | 'earliest'
}

declare module 'web3-core-helpers' {
  export type Callback<T> = (error: Error | null, result?: T) => void
  export interface JsonRpcResponse {
    jsonrpc: string
    id: number
    result?: any
    // this shows us how we are using it, but there is no way of overriding the type of an attribute
    error?: string | { message: string; code: number }
  }
}
