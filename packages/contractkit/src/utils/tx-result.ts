import debugFactory from 'debug'
import { ExternalPromise } from 'src/utils/external-promise'
import PromiEvent from 'web3/promiEvent'
import { TransactionReceipt } from 'web3/types'

const debug = debugFactory('contractkit:txresult')

export function toTxResult(pe: PromiEvent<any>) {
  return new TransactionResult(pe)
}

export class TransactionResult {
  private hashFuture = new ExternalPromise<string>()
  private receiptFuture = new ExternalPromise<TransactionReceipt>()
  private confirmationsFuture = new ExternalPromise<boolean>()

  constructor(pe: PromiEvent<any>) {
    pe.on('transactionHash', (hash: string) => {
      debug('hash: %s', hash)
      this.hashFuture.resolve(hash)
    })
      .on('receipt', (receipt: TransactionReceipt) => {
        debug('receipt: %O', receipt)
        this.receiptFuture.resolve(receipt)
      })
      .on('confirmation', (confirmationNumber: number) => {
        if (confirmationNumber > 1) {
          // "confirmation" event is called for 24 blocks.
          // if check to avoid polluting the logs and trying to remove
          // the standby notification more than once
          return
        }
        debug('tx confirmed')
        this.confirmationsFuture.resolve(true)
      })
      .on('error', ((error: any, receipt: TransactionReceipt | false) => {
        if (!receipt) {
          debug('send-error: %o', error)
          this.hashFuture.reject(error)
        } else {
          debug('mining-error: %o, %O', error, receipt)
        }
        this.receiptFuture.reject(error)
        this.confirmationsFuture.reject(error)
      }) as any)
  }

  getHash() {
    return this.hashFuture
  }

  waitReceipt() {
    return this.receiptFuture
  }

  waitConfirmation() {
    return this.confirmationsFuture
  }
}
