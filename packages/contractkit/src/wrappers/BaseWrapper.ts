import { ContractKit } from 'src/kit'
import { TxOptions } from 'src/utils/send-tx'
import { TransactionResult } from 'src/utils/tx-result'
import { TransactionObject } from 'web3/eth/types'

type Method<I extends any[], O> = (...args: I) => TransactionObject<O>

export abstract class BaseWrapper<T> {
  constructor(protected readonly kit: ContractKit, protected readonly contract: T) {}

  protected proxySend<I extends any[], O>(methodFn: Method<I, O>) {
    return (...args: I) => this.wrapSend(methodFn(...args))
  }
  protected proxyCall<I extends any[], O>(methodFn: Method<I, O>) {
    return (...args: I) => methodFn(...args).call()
  }

  protected proxyCallAndTransform<I extends any[], O, F>(
    methodFn: Method<I, O>,
    post: (input: O) => F
  ) {
    return (...args: I) =>
      methodFn(...args)
        .call()
        .then(post)
  }

  protected wrapSend<O>(txo: TransactionObject<O>): CeloTransactionObject<O> {
    return {
      send: (options?: TxOptions) => this.kit.sendTransactionObject(txo, options),
      txo,
    }
  }
}

export interface CeloTransactionObject<O> {
  txo: TransactionObject<O>
  send(options?: TxOptions): Promise<TransactionResult>
}
