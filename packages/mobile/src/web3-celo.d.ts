import * as Web3Eth from 'web3-eth'
declare module 'web3-eth' {
  import { Tx } from 'web3-core'

  export interface TransactionObject<T> {
    arguments: any[]
    call(tx?: Tx): Promise<T>
    send(tx?: Tx): PromiEvent<T>
    estimateGas(tx?: Tx): Promise<number>
    encodeABI(): string
  }
}
