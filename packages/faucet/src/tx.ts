// tslint:disable: max-classes-per-file
// TODO: investigate tslint issues

import Web3 from 'web3'
import { TransactionObject, Tx } from 'web3/eth/types'
import PromiEvent from 'web3/promiEvent'
import { TransactionReceipt } from 'web3/types'
import { signTransaction } from './protocol/signing-utils'

export function getAddress(web3: Web3, pk: string) {
  pk = Web3.utils.isHexStrict(pk) ? pk : '0x' + pk
  return web3.eth.accounts.privateKeyToAccount(pk).address
}

export async function sendTx(
  web3: Web3,
  tx: TransactionObject<any>,
  privateKey: string,
  txParams?: Tx
) {
  console.log('tx: tx.data= %o, tx= %o', tx.arguments, txParams)

  const gasPrice = await web3.eth.getGasPrice()
  const address = getAddress(web3, privateKey)

  // Estimate Gas mutates txParams, but we need our original obj later
  const clonedTxParams = { ...txParams, from: address, gasPrice }
  const estGas = (Web3.utils.toBN(await tx.estimateGas(clonedTxParams)) as any).muln(10)
  console.log('tx: estimatedGas= %s', estGas)

  const signedTx: any = await signTransaction(
    web3,
    {
      ...txParams,
      from: address,
      gasPrice,
      data: tx.encodeABI(),
      gas: estGas,
    },
    privateKey
  )

  const rawTransaction = signedTx.rawTransaction.toString('hex')
  return new TransactionResult(web3.eth.sendSignedTransaction(rawTransaction))
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
      console.info('@TransactionResult hash: ', hash)
      this.hashFuture.resolve(hash)
    })
      .on('receipt', (receipt: TransactionReceipt) => {
        console.info('@TransactionResult receipt: ', receipt)
        this.receiptFuture.resolve(receipt)
      })
      .on('error', ((error: any, receipt: TransactionReceipt | false) => {
        console.info('@TransactionResult error: %O %O', error, receipt)
        if (!receipt) {
          console.info('@TransactionResult no receipt')
          this.hashFuture.reject(error)
        } else {
          console.info('@TransactionResult mining error')
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
