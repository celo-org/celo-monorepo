import { TransactionConfig } from 'web3-core'

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
