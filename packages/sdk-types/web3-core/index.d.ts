import 'web3-core'

declare module 'web3-core' {
  export interface CeloParams {
    feeCurrency: string
    gatewayFeeRecipient: string
    gatewayFee: string
  }

  export type Tx = TransactionConfig & Partial<CeloParams>
  export type TxPending = Transaction & CeloParams
  export type TxReceipt = TransactionReceipt & CeloParams
  export interface RLPEncodedTx extends RLPEncodedTransaction {
    raw: string
    tx: RLPEncodedTransaction['tx'] & CeloParams
  }
}
