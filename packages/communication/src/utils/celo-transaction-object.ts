import { CeloTx, CeloTxObject, CeloTxReceipt } from '@celo/communication/types/commons'
import { NodeCommunicationWrapper } from '..'
import { TransactionResult } from './tx-result'

export type CeloTransactionParams = Omit<CeloTx, 'data'>

export function toTransactionObject<O>(
  communication: NodeCommunicationWrapper,
  txo: CeloTxObject<O>,
  defaultParams?: CeloTransactionParams
): CeloTransactionObject<O> {
  return new CeloTransactionObject(communication, txo, defaultParams)
}

export class CeloTransactionObject<O> {
  constructor(
    private communication: NodeCommunicationWrapper,
    readonly txo: CeloTxObject<O>,
    readonly defaultParams?: CeloTransactionParams
  ) {}

  /** send the transaction to the chain */
  send = (params?: CeloTransactionParams): Promise<TransactionResult> => {
    return this.communication.sendTransactionObject(this.txo, { ...this.defaultParams, ...params })
  }

  /** send the transaction and waits for the receipt */
  sendAndWaitForReceipt = (params?: CeloTransactionParams): Promise<CeloTxReceipt> =>
    this.send(params).then((result) => result.waitReceipt())
}
