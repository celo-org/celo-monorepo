import * as web3types from '@types/web3/types'
import 'web3/eth/types'

declare module 'src/newtypes' {
  export default web3types
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
