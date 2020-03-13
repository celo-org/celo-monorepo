import BigNumber from 'bignumber.js'
import 'web3-core'
import { Tx } from 'web3-core'

declare module 'web3-core' {
  export interface TransactionConfig extends TransactionConfig {
    value?: number | string | BigNumber
    gasPrice?: number | string | BigNumber
  }

  export interface Tx extends TransactionConfig {
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
  }
}

declare module 'web3-eth' {
  export interface TransactionObject<T> {
    arguments: any[]
    call(tx?: Tx): Promise<T>
    send(tx?: Tx): PromiEvent<T>
    estimateGas(tx?: Tx): Promise<number>
    encodeABI(): string
  }
}
