import BigNumber from 'bignumber.js'
import 'web3-core'
// tslint:disable-next-line:no-duplicate-imports
import { Tx } from 'web3-core'
import { Contract } from 'web3-eth-contract'

declare module 'web3-core' {
  export interface TransactionConfig extends TransactionConfig {
    value?: number | string | BigNumber
    gasPrice?: number | string | BigNumber
  }

  export interface Tx extends TransactionConfig {
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
    nonce?: number
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
}

declare module 'web3-eth' {
  export interface Transaction {
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
  }

  export interface TransactionObject<T> {
    arguments: any[]
    call(tx?: Tx): Promise<T>
    send(tx?: Tx): PromiEvent<T>
    estimateGas(tx?: Tx): Promise<number>
    encodeABI(): string
    _parent: Contract
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
