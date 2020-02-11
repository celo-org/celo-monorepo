import '@types/web3'
import 'web3/eth/types'

declare module 'web3/types' {
  export class Web3 {}
}

declare module 'web3/eth/types' {
  export interface Tx {
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
  }

  export interface Transaction {
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
  }
}
