import { bufferToHex, ensureLeading0x } from '@celo/base/lib/address'
import { zip } from '@celo/base/lib/collections'
import {
  CeloTransactionObject,
  CeloTxObject,
  Contract,
  EventLog,
  PastEventOptions,
  toTransactionObject,
} from '@celo/connect'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { ICeloVersionedContract } from '../generated/ICeloVersionedContract'
import { ContractKit } from '../kit'
import { ContractVersion } from '../versions'

/** Represents web3 native contract Method */
type Method<I extends any[], O> = (...args: I) => CeloTxObject<O>

type Events<T extends Contract> = keyof T['events']
type Methods<T extends Contract> = keyof T['methods']
type EventsEnum<T extends Contract> = {
  [event in Events<T>]: event
}

/** Base ContractWrapper */
export abstract class BaseWrapper<T extends Contract> {
  protected _version?: T['methods'] extends ICeloVersionedContract['methods']
    ? ContractVersion
    : never

  constructor(protected readonly kit: ContractKit, protected readonly contract: T) {}

  /** Contract address */
  get address(): string {
    return this.contract.options.address
  }

  async version() {
    if (!this._version) {
      const raw = await this.contract.methods.getVersionNumber().call()
      // @ts-ignore conditional type
      this._version = ContractVersion.fromRaw(raw)
    }
    return this._version!
  }

  protected async onlyVersionOrGreater(version: ContractVersion) {
    if (!(await this.version()).isAtLeast(version)) {
      throw new Error(`Bytecode version ${this._version} is not compatible with ${version} yet`)
    }
  }

  /** Contract getPastEvents */
  public getPastEvents(event: Events<T>, options: PastEventOptions): Promise<EventLog[]> {
    return this.contract.getPastEvents(event as string, options)
  }

  events: T['events'] = this.contract.events

  eventTypes = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

  methodIds = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )
}

export const valueToBigNumber = (input: BigNumber.Value) => new BigNumber(input)

export const fixidityValueToBigNumber = (input: BigNumber.Value) => fromFixed(new BigNumber(input))

export const valueToString = (input: BigNumber.Value) => valueToBigNumber(input).toFixed()

export const valueToFixidityString = (input: BigNumber.Value) =>
  toFixed(valueToBigNumber(input)).toFixed()

export const valueToInt = (input: BigNumber.Value) =>
  valueToBigNumber(input).integerValue().toNumber()

export const valueToFrac = (numerator: BigNumber.Value, denominator: BigNumber.Value) =>
  valueToBigNumber(numerator).div(valueToBigNumber(denominator))

enum TimeDurations {
  millennium = 31536000000000,
  century = 3153600000000,
  decade = 315360000000,
  year = 31536000000,
  quarter = 7776000000,
  month = 2592000000,
  week = 604800000,
  day = 86400000,
  hour = 3600000,
  minute = 60000,
  second = 1000,
  millisecond = 1,
}

type TimeUnit = keyof typeof TimeDurations

// taken mostly from https://gist.github.com/RienNeVaPlus/024de3431ae95546d60f2acce128a7e2
export function secondsToDurationString(
  durationSeconds: BigNumber.Value,
  outputUnits: TimeUnit[] = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second']
) {
  let durationMilliseconds = valueToBigNumber(durationSeconds)
    .times(TimeDurations.second)
    .toNumber()

  if (durationMilliseconds <= 0) {
    return 'past'
  }

  const durations = outputUnits.reduce((res: Map<TimeUnit, number>, key) => {
    const unitDuration = TimeDurations[key]
    const value = Math.floor(durationMilliseconds / unitDuration)
    durationMilliseconds -= value * unitDuration
    return res.set(key, value)
  }, new Map())

  let s = ''
  durations.forEach((value, unit) => {
    if (value > 0) {
      s += s !== '' ? ', ' : ''
      s += `${value} ${unit}${value > 1 ? 's' : ''}`
    }
  })
  return s
}

export const blocksToDurationString = (input: BigNumber.Value) =>
  secondsToDurationString(valueToBigNumber(input).times(5)) // TODO: fetch blocktime

const DATE_TIME_OPTIONS = {
  year: 'numeric',
  month: 'short',
  weekday: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  timeZoneName: 'short',
} as const

export const unixSecondsTimestampToDateString = (input: BigNumber.Value) => {
  const date = new Date(valueToInt(input) * TimeDurations.second)
  return Intl.DateTimeFormat('default', DATE_TIME_OPTIONS).format(date)
}

// Type of bytes in solidity gets represented as a string of number array by typechain and web3
// Hopefully this will improve in the future, at which point we can make improvements here
type SolidityBytes = string | number[]
export const stringToSolidityBytes = (input: string) => ensureLeading0x(input) as SolidityBytes
export const bufferToSolidityBytes = (input: Buffer) => stringToSolidityBytes(bufferToHex(input))
export const solidityBytesToString = (input: SolidityBytes): string => {
  if (input === null || input === undefined || typeof input === 'string') {
    return input
  } else if (Array.isArray(input)) {
    const hexString = input.reduce((acc, num) => acc + num.toString(16).padStart(2, '0'), '')
    return ensureLeading0x(hexString)
  } else {
    throw new Error('Unexpected input type for solidity bytes')
  }
}

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
    return (...args: InputArgs) =>
      toTransactionObject(kit.connection, methodFn(...preParse(...args)))
  } else {
    const methodFn = sendArgs[0]
    return (...args: InputArgs) => toTransactionObject(kit.connection, methodFn(...args))
  }
}
