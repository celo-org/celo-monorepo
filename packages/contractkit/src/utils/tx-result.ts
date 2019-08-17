import debugFactory from 'debug'
import PromiEvent from 'web3/promiEvent'
import { TransactionReceipt } from 'web3/types'
import { ExternalPromise } from './external-promise'

const debug = debugFactory('kit:tx:result')

export function toTxResult(pe: PromiEvent<any>) {
  return new TransactionResult(pe)
}

export class TransactionResult {
  private hashFuture = new ExternalPromise<string>()
  private receiptFuture = new ExternalPromise<TransactionReceipt>()

  constructor(pe: PromiEvent<any>) {
    pe.on('transactionHash', (hash: string) => {
      debug('hash: %s', hash)
      this.hashFuture.resolve(hash)
    })
      .on('receipt', (receipt: TransactionReceipt) => {
        debug('receipt: %O', receipt)
        this.receiptFuture.resolve(receipt)
      })

      .on('error', ((error: any, receipt: TransactionReceipt | false) => {
        if (!receipt) {
          debug('send-error: %o', error)
          this.hashFuture.reject(error)
        } else {
          debug('mining-error: %o, %O', error, receipt)
        }
        this.receiptFuture.reject(error)
      }) as any)
  }

  getHash() {
    return this.hashFuture
  }

  waitReceipt() {
    return this.receiptFuture
  }
}
