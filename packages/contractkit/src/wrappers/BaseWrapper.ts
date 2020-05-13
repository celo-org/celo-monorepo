import { ensureLeading0x, hexToBuffer } from '@celo/utils/lib/address'
import { zip } from '@celo/utils/lib/collections'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { EventLog, TransactionReceipt, Tx } from 'web3-core'
import { TransactionObject } from 'web3-eth'
import { Contract, PastEventOptions } from 'web3-eth-contract'
import { ContractKit } from '../kit'
import { TransactionResult } from '../utils/tx-result'

/** Represents web3 native contract Method */
type Method<I extends any[], O> = (...args: I) => TransactionObject<O>

export interface Filter {
  [key: string]: number | string | string[] | number[]
}

/** Base ContractWrapper */
export abstract class BaseWrapper<T extends Contract> {
  constructor(protected readonly kit: ContractKit, protected readonly contract: T) {}

  /** Contract address */
  get address(): string {
    // TODO fix typings
    return (this.contract as any)._address
  }

  /** Contract getPastEvents */
  protected getPastEvents(event: string, options: PastEventOptions): Promise<EventLog[]> {
    return this.contract.getPastEvents(event, options)
  }

  events = this.contract.events
}

export const valueToBigNumber = (input: BigNumber.Value) => new BigNumber(input)

export const fixidityValueToBigNumber = (input: BigNumber.Value) => fromFixed(new BigNumber(input))

export const valueToString = (input: BigNumber.Value) => valueToBigNumber(input).toFixed()

export const valueToFixidityString = (input: BigNumber.Value) =>
  toFixed(valueToBigNumber(input)).toFixed()

export const valueToInt = (input: BigNumber.Value) =>
  valueToBigNumber(input)
    .integerValue()
    .toNumber()

export const valueToFrac = (numerator: BigNumber.Value, denominator: BigNumber.Value) =>
  valueToBigNumber(numerator).div(valueToBigNumber(denominator))

export const stringToBuffer = hexToBuffer

export const bufferToString = (buf: Buffer) => ensureLeading0x(buf.toString('hex'))

type SolBytes = string | number[]
const toBytes = (input: any): SolBytes => input
const fromBytes = (input: SolBytes): any => input as any

export const stringToBytes = (input: string) => toBytes(ensureLeading0x(input))

export const bufferToBytes = (input: Buffer) => stringToBytes(bufferToString(input))

export const bytesToString = (input: SolBytes): string => fromBytes(input)

type Parser<A, B> = (input: A) => B

/** Identity Parser */
export const identity = <A>(a: A) => a
export const stringIdentity = (x: string) => x

/**
 * Tuple parser
 * Useful to map different input arguments
 */
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
    return (...args: InputArgs) => toTransactionObject(kit, methodFn(...preParse(...args)))
  } else {
    const methodFn = sendArgs[0]
    return (...args: InputArgs) => toTransactionObject(kit, methodFn(...args))
  }
}

export function toTransactionObject<O>(
  kit: ContractKit,
  txo: TransactionObject<O>,
  defaultParams?: Omit<Tx, 'data'>
): CeloTransactionObject<O> {
  return new CeloTransactionObject(kit, txo, defaultParams)
}

export type CeloTransactionParams = Omit<Tx, 'data'>
export class CeloTransactionObject<O> {
  constructor(
    private kit: ContractKit,
    readonly txo: TransactionObject<O>,
    readonly defaultParams?: CeloTransactionParams
  ) {}

  /** send the transaction to the chain */
  send = (params?: CeloTransactionParams): Promise<TransactionResult> => {
    return this.kit.sendTransactionObject(this.txo, { ...this.defaultParams, ...params })
  }

  /** send the transaction and waits for the receipt */
  sendAndWaitForReceipt = (params?: CeloTransactionParams): Promise<TransactionReceipt> =>
    this.send(params).then((result) => result.waitReceipt())
}
