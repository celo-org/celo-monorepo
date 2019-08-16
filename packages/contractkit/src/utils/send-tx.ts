import debugFactory from 'debug'
import { TransactionObject } from 'web3/eth/types'
import { Address } from '../base'
import { toTxResult, TransactionResult } from './tx-result'

const debug = debugFactory('kit:tx:send')

export interface TxOptions {
  gasInflationFactor?: number
  gasFeeRecipient?: Address
  gasCurrency?: Address | undefined
  from?: Address
  estimatedGas?: number | undefined
}

/**
 * sendTransaction mainly abstracts the sending of a transaction in a promise like
 * interface.
 */
export async function sendTransaction<T>(
  tx: TransactionObject<T>,
  txOptions: TxOptions = {}
): Promise<TransactionResult> {
  const txParams: any = {
    from: txOptions.from,
    gasCurrency: txOptions.gasCurrency,
    gasPrice: '0',
  }

  let gas = txOptions.estimatedGas
  if (gas === undefined) {
    const inflactionFactor = txOptions.gasInflationFactor || 1
    gas = Math.round((await tx.estimateGas(txParams)) * inflactionFactor)
    debug('estimatedGas: %s', gas)
    // logger(EstimatedGas(estimatedGas))
  }

  const promiEvent = tx.send({
    from: txOptions.from,
    // @ts-ignore
    gasCurrency: txOptions.gasCurrency,
    // TODO needed for locally signed tx, ignored by now (celo-blockchain with set it)
    // gasFeeRecipient: txOptions.gasFeeRecipient,
    gas,
    // Hack to prevent web3 from adding the suggested gold gas price, allowing geth to add
    // the suggested price in the selected gasCurrency.
    // TODO this won't work for locally signed TX
    gasPrice: '0',
  })
  return toTxResult(promiEvent)
}
