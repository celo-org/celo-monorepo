import { Future } from '@celo/utils/lib/future'
import debugFactory from 'debug'
import PromiEvent from 'web3/promiEvent'
import { TransactionReceipt } from 'web3/types'

const debug = debugFactory('kit:tx:result')

/**
 * Transforms a `PromiEvent` to a `TransactionResult`.
 *
 * PromiEvents are returned by web3 when we do a `contract.method.xxx.send()`
 */
export function toTxResult(pe: PromiEvent<any>) {
  return new TransactionResult(pe)
}

/**
 * Replacement interface for web3's `PromiEvent`. Instead of emiting events
 * to signal different stages, eveything is exposed as a promise. Which ends
 * up being nicer when doing promise/async based programming.
 */
export class TransactionResult {
  private hashFuture = new Future<string>()
  private receiptFuture = new Future<TransactionReceipt>()

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

  /** Get (& wait for) transaction hash */
  getHash() {
    return this.hashFuture.wait()
  }

  /** Get (& wait for) transaction receipt */
  waitReceipt() {
    return this.receiptFuture.wait()
  }
}
