import { zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import Contract from 'web3/eth/contract'
import { TransactionObject } from 'web3/eth/types'
import { TransactionReceipt } from 'web3/types'
import { ContractKit } from '../kit'
import { TxOptions } from '../utils/send-tx'
import { TransactionResult } from '../utils/tx-result'

type Method<I extends any[], O> = (...args: I) => TransactionObject<O>

export type NumberLike = string | number | BigNumber

export abstract class BaseWrapper<T extends Contract> {
  constructor(protected readonly kit: ContractKit, protected readonly contract: T) {}

  get address(): string {
    // TODO fix typings
    return (this.contract as any)._address
  }
}

export interface CeloTransactionObject<O> {
  txo: TransactionObject<O>
  send(options?: TxOptions): Promise<TransactionResult>
  sendAndWaitForReceipt(options?: TxOptions): Promise<TransactionReceipt>
}

export function toBigNumber(input: string) {
  return new BigNumber(input)
}

export function toNumber(input: string) {
  return parseInt(input, 10)
}

export function parseNumber(input: NumberLike) {
  return new BigNumber(input).toString(10)
}

type Parser<A, B> = (input: A) => B

export function identity<A>(a: A) {
  return a
}

export function tupleParser<A0, B0>(parser0: Parser<A0, B0>): (...args: [A0]) => [B0]
export function tupleParser<A0, B0, A1, B1>(
  parser0: Parser<A0, B0>,
  parser1: Parser<A1, B1>
): (...args: [A0, A1]) => [B0, B1]
export function tupleParser<A0, B0, A1, B1, A2, B2>(
  parser0: Parser<A0, B0>,
  parser1: Parser<A1, B1>,
  parser2: Parser<A2, B2>
): (...args: [A0, A1, A2]) => [B0, B1, B2]
export function tupleParser<A0, B0, A1, B1, A2, B2, A3, B3>(
  parser0: Parser<A0, B0>,
  parser1: Parser<A1, B1>,
  parser2: Parser<A2, B2>,
  parser3: Parser<A3, B3>
): (...args: [A0, A1, A2, A3]) => [B0, B1, B2, B3]
export function tupleParser(...parsers: Array<Parser<any, any>>) {
  return (...args: any[]) => zip((parser, input) => parser(input), parsers, args)
}

/**
 * Specifies all different possible proxyCall arguments so that
 * it always return a function of type: (...args:InputArgs) => Promise<Output>
 *
 * cases:
 *  - methodFn
 *  - parseInputArgs => methodFn
 *  - parseInputArgs => methodFn => parseOutput
 *  - methodFn => parseOutput
 */
type ProxyCallArgs<
  InputArgs extends any[],
  ParsedInputArgs extends any[],
  PreParsedOutput,
  Output
> =
  // parseInputArgs => methodFn => parseOutput
  | [
      Method<ParsedInputArgs, PreParsedOutput>,
      (...arg: InputArgs) => ParsedInputArgs,
      (arg: PreParsedOutput) => Output
    ]
  // methodFn => parseOutput
  | [Method<InputArgs, PreParsedOutput>, undefined, (arg: PreParsedOutput) => Output]
  // parseInputArgs => methodFn
  | [Method<ParsedInputArgs, Output>, (...arg: InputArgs) => ParsedInputArgs]
  // methodFn
  | [Method<InputArgs, Output>]

/**
 * Creates a proxy to call a web3 native contract method.
 *
 * There are 4 cases:
 *  - methodFn
 *  - parseInputArgs => methodFn
 *  - parseInputArgs => methodFn => parseOutput
 *  - methodFn => parseOutput
 *
 * @param methodFn Web3 methods function
 * @param parseInputArgs [optional] parseInputArgs function, tranforms arguments into `methodFn` expected inputs
 * @param parseOutput [optional] parseOutput function, transforms `methodFn` output into proxy return
 */
export function proxyCall<
  InputArgs extends any[],
  ParsedInputArgs extends any[],
  PreParsedOutput,
  Output
>(
  methodFn: Method<ParsedInputArgs, PreParsedOutput>,
  parseInputArgs: (...args: InputArgs) => ParsedInputArgs,
  parseOutput: (o: PreParsedOutput) => Output
): (...args: InputArgs) => Promise<Output>
export function proxyCall<InputArgs extends any[], PreParsedOutput, Output>(
  methodFn: Method<InputArgs, PreParsedOutput>,
  x: undefined,
  parseOutput: (o: PreParsedOutput) => Output
): (...args: InputArgs) => Promise<Output>
export function proxyCall<InputArgs extends any[], ParsedInputArgs extends any[], Output>(
  methodFn: Method<ParsedInputArgs, Output>,
  parseInputArgs: (...args: InputArgs) => ParsedInputArgs
): (...args: InputArgs) => Promise<Output>
export function proxyCall<InputArgs extends any[], Output>(
  methodFn: Method<InputArgs, Output>
): (...args: InputArgs) => Promise<Output>

export function proxyCall<
  InputArgs extends any[],
  ParsedInputArgs extends any[],
  PreParsedOutput,
  Output
>(
  ...callArgs: ProxyCallArgs<InputArgs, ParsedInputArgs, PreParsedOutput, Output>
): (...args: InputArgs) => Promise<Output> {
  if (callArgs.length === 3 && callArgs[1] != null) {
    const methodFn = callArgs[0]
    const parseInputArgs = callArgs[1]
    const parseOutput = callArgs[2]
    return (...args: InputArgs) =>
      methodFn(...parseInputArgs(...args))
        .call()
        .then(parseOutput)
  } else if (callArgs.length === 3) {
    const methodFn = callArgs[0]
    const parseOutput = callArgs[2]
    return (...args: InputArgs) =>
      methodFn(...args)
        .call()
        .then(parseOutput)
  } else if (callArgs.length === 2) {
    const methodFn = callArgs[0]
    const parseInputArgs = callArgs[1]
    return (...args: InputArgs) => methodFn(...parseInputArgs(...args)).call()
  } else {
    const methodFn = callArgs[0]
    return (...args: InputArgs) => methodFn(...args).call()
  }
}

/**
 * Specifies all different possible proxySend arguments so that
 * it always return a function of type: (...args:InputArgs) => CeloTransactionObject<Output>
 *
 * cases:
 *  - methodFn
 *  - parseInputArgs => methodFn
 */
type ProxySendArgs<InputArgs extends any[], ParsedInputArgs extends any[], Output> =
  // parseInputArgs => methodFn
  | [Method<ParsedInputArgs, Output>, (...arg: InputArgs) => ParsedInputArgs]
  // methodFn
  | [Method<InputArgs, Output>]

/**
 * Creates a proxy to send a tx on a web3 native contract method.
 *
 * There are 2 cases:
 *  - call methodFn (no pre or post parsing)
 *  - preParse arguments & call methodFn
 *
 * @param methodFn Web3 methods function
 * @param preParse [optional] preParse function, tranforms arguments into `methodFn` expected inputs
 */
export function proxySend<InputArgs extends any[], ParsedInputArgs extends any[], Output>(
  kit: ContractKit,
  ...sendArgs: ProxySendArgs<InputArgs, ParsedInputArgs, Output>
): (...args: InputArgs) => CeloTransactionObject<Output> {
  if (sendArgs.length === 2) {
    const methodFn = sendArgs[0]
    const preParse = sendArgs[1]
    return (...args: InputArgs) => wrapSend(kit, methodFn(...preParse(...args)))
  } else {
    const methodFn = sendArgs[0]
    return (...args: InputArgs) => wrapSend(kit, methodFn(...args))
  }
}

export function wrapSend<O>(kit: ContractKit, txo: TransactionObject<O>): CeloTransactionObject<O> {
  return {
    send: (options?: TxOptions) => kit.sendTransactionObject(txo, options),
    txo,
    sendAndWaitForReceipt: (options?: TxOptions) =>
      kit.sendTransactionObject(txo, options).then((result) => result.waitReceipt()),
  }
}
