import 'web3-core'

declare module 'web3-core' {
  // export type Tx = TransactionConfig & Partial<CeloParams>
  export interface RLPEncodedTx extends RLPEncodedTransaction {
    raw: string
    tx: RLPEncodedTransaction['tx'] & CeloParams
  }
}
