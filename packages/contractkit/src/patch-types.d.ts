import 'web3/eth/types'

declare module 'web3/eth/types' {
  export interface Tx {
    gasBeneficiary?: string
    gasCurrency?: string
  }
}
