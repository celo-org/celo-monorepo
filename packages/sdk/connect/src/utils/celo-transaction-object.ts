import { Connection } from '../connection'
import { CeloTx, CeloTxObject, CeloTxReceipt } from '../types'
import { TransactionResult } from './tx-result'

export type CeloTransactionParams = Omit<CeloTx, 'data'>

export function toTransactionObject<O>(
  connection: Connection,
  txo: CeloTxObject<O>,
  defaultParams?: CeloTransactionParams
): CeloTransactionObject<O> {
  return new CeloTransactionObject(connection, txo, defaultParams)
}

export class CeloTransactionObject<O> {
  constructor(
    private connection: Connection,
    readonly txo: CeloTxObject<O>,
    readonly defaultParams?: CeloTransactionParams
  ) {}

  /** send the transaction to the chain */
  send = (params?: CeloTransactionParams): Promise<TransactionResult> => {
    return this.connection.sendTransactionObject(this.txo, { ...this.defaultParams, ...params })
  }

  /** send the transaction and waits for the receipt */
  sendAndWaitForReceipt = (params?: CeloTransactionParams): Promise<CeloTxReceipt> =>
    this.send(params).then((result) => result.waitReceipt())
}
