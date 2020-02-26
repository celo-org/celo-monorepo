import { TransactionConfig } from 'web3-core'

declare module 'web3-core' {
  export interface Tx extends TransactionConfig {
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
  }
}

declare module 'web3-eth' {
  import { Tx } from 'web3-core'
  // export interface Tx {
  //   from?: string;
  //   to?: string;
  //   value?: string | number;
  //   gas?: string | number;
  //   gasPrice?: string | number;
  //   data?: string;
  //   nonce?: string | number;
  //   chainId?: string | number;
  //   feeCurrency?: string
  //   gatewayFeeRecipient?: string
  //   gatewayFee?: string
  // }

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
  }

  export type BlockType = 'latest' | 'pending' | 'genesis' | number
}
