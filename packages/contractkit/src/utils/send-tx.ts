import debugFactory from 'debug'
import { Address } from 'src/base'
import { toTxResult, TransactionResult } from 'src/utils/tx-result'
import { TransactionObject } from 'web3/eth/types'

const debug = debugFactory('contractkit:sendtx')

export interface TxOptions {
  gasInflationFactor?: number
  gasBeneficiary?: Address
  gasCurrency?: Address
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
    gasCurrency: txOptions.gasCurrency,
    gasBeneficiary: txOptions.gasBeneficiary,
    gas,
    // Hack to prevent web3 from adding the suggested gold gas price, allowing geth to add
    // the suggested price in the selected gasCurrency.
    gasPrice: '0',
  })
  return toTxResult(promiEvent)
}
