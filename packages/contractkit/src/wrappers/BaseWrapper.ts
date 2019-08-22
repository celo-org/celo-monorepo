import BigNumber from 'bignumber.js'
import Contract from 'web3/eth/contract'
import { TransactionObject } from 'web3/eth/types'
import { ContractKit } from '../kit'
import { TxOptions } from '../utils/send-tx'
import { TransactionResult } from '../utils/tx-result'

type Method<I extends any[], O> = (...args: I) => TransactionObject<O>

export abstract class BaseWrapper<T extends Contract> {
  constructor(protected readonly kit: ContractKit, protected readonly contract: T) {}

  get address(): string {
    // TODO fix typings
    return (this.contract as any)._address
  }

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

export function toBigNumber(input: string) {
  return new BigNumber(input)
}

export function toNumber(input: string) {
  return parseInt(input, 10)
}
