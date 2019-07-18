// tslint:disable:class-name max-classes-per-file
// TODO: investigate tslint issues
import debugFactory from 'debug'
import Web3 from 'web3'
import { TransactionObject, Tx } from 'web3/eth/types'
import PromiEvent from 'web3/promiEvent'
import { TransactionReceipt } from 'web3/types'

const debug = debugFactory('cli:tx')
const debugTxObjects = debugFactory('cli:tx:obj')

export async function sendTx(tx: TransactionObject<any>, txParams?: Tx) {
  debug('sendTx: %o, %o', tx.arguments, txParams)
  // Estimate Gas mutates txParams, but we need our original obj later
  const clonedTxParams = { ...txParams }
  const estGas = Web3.utils.toBN(await tx.estimateGas(clonedTxParams))
  debug('estimatedGas: %s', estGas)

  const inflateFactor = 1.3
  const adjustedGas = (estGas.toNumber() * inflateFactor).toFixed() // round decimal result
  debug('inflatedGas: %s', adjustedGas)

  return new TransactionResult(
    tx.send({
      gas: adjustedGas.toString(),
      // Hack to prevent web3 from adding the suggested gold gas price, allowing geth to add
      // the suggested price in the selected gasCurrency.
      gasPrice: '0',
      ...txParams,
    })
  )
}

export class Future<T> {
  public resolve!: (val: T) => void
  public reject!: (err: any) => void
  private readonly _promise: Promise<T>

  constructor() {
    this._promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  wait(): Promise<T> {
    return this._promise
  }
}

export class TransactionResult {
  private hashFuture = new Future<string>()
  private receiptFuture = new Future<TransactionReceipt>()

  constructor(pe: PromiEvent<any>) {
    pe.on('transactionHash', (hash: string) => {
      debug('hash: %s', hash)
      this.hashFuture.resolve(hash)
    })
      .on('receipt', (receipt: TransactionReceipt) => {
        debugTxObjects('receipt: %O', receipt)
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
    return this.hashFuture.wait()
  }

  waitReceipt() {
    return this.receiptFuture.wait()
  }
}
