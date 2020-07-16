import BigNumber from 'bignumber.js'
import * as BN from 'bn.js'
import { PromiEvent, Tx } from 'web3-core'
import 'web3-eth'

declare module 'web3-eth' {
  export interface TransactionObject<T> {
    arguments: any[]
    call(tx?: Tx): Promise<T>
    send(tx?: Tx): PromiEvent<T>
    estimateGas(tx?: Tx): Promise<number>
    encodeABI(): string
  }

  export type BlockType = string | number | BN | BigNumber | 'latest' | 'pending' | 'earliest'
}
