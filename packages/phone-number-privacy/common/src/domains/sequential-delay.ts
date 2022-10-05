import {
  EIP712Optional,
  eip712OptionalSchema,
  eip712OptionalType,
  EIP712TypesWithPrimary,
} from '@celo/utils/lib/sign-typed-data-utils'
import * as t from 'io-ts'
import { DomainIdentifiers } from './constants'
import { Domain } from './domains'

// Concrete Domain subtypes are only assignable to Domain and EIP712Object when using type instead
// of interface. Otherwise the compiler complains about a missing index signature.
// tslint:disable:interface-over-type-literal

export type SequentialDelayStage = {
  /**
   * How many seconds each batch of attempts in this stage is delayed with
   * respect to the timer.
   */
  delay: number
  /**
   * Whether the timer should be reset between attempts during this stage.
   * Defaults to true.
   */
  resetTimer: EIP712Optional<boolean>
  /**
   * The number of continuous attempts a user gets before the next delay
   * in each repetition of this stage. Defaults to 1.
   */
  batchSize: EIP712Optional<number>
  /**
   * The number of times this stage repeats before continuing to the next stage
   * in the RateLimit array. Defaults to 1.
   */
  repetitions: EIP712Optional<number>
}

export type SequentialDelayDomain = {
  name: DomainIdentifiers.SequentialDelay
  version: '1'
  stages: SequentialDelayStage[]
  /**
   * Optional Celo address against which signed requests must be authenticated.
   * In the case of Cloud Backup, this will be derived from a one-time key stored with the ciphertext.
   * Encoded as a checksummed address with leading "0x".
   */
  address: EIP712Optional<string>
  /**
   * Optional string to distinguish the output of this domain instance from
   * other SequentialDelayDomain instances
   */
  salt: EIP712Optional<string>
}

export type SequentialDelayDomainOptions = {
  /**
   * EIP-712 signature over the entire request by the address specified in the domain.
   * Required if `address` is defined in the domain instance. If `address` is
   * not defined in the domain instance, then a signature must not be provided.
   * Encoded as a hex string with leading 0x.
   */
  signature: EIP712Optional<string>
  /**
   * Used to prevent replay attacks. Required if a signature is provided.
   * Code verifying the signature for rate limiting should check this nonce against a counter of
   * applied requests. E.g. Ensure the nonce is 0 on the first request and 2 on the third.
   */
  nonce: EIP712Optional<number>
}

export interface SequentialDelayDomainState {
  /** Timestamp in seconds since the Unix Epoch determining when a new request will be accepted. */
  timer: number
  /** Number of queries that have been accepted for the SequentialDelayDomain instance. */
  counter: number
  /** Whether or not the domain has been disabled. If disabled, no more queries will be served */
  disabled: boolean
}

/** io-ts schema for encoding and decoding SequentialDelayStage structs */
export const SequentialDelayStageSchema: t.Type<SequentialDelayStage> = t.strict({
  delay: t.number,
  resetTimer: eip712OptionalSchema(t.boolean),
  batchSize: eip712OptionalSchema(t.number),
  repetitions: eip712OptionalSchema(t.number),
})

/** io-ts schema for encoding and decoding SequentialDelayDomain structs */
export const SequentialDelayDomainSchema: t.Type<SequentialDelayDomain> = t.strict({
  name: t.literal(DomainIdentifiers.SequentialDelay),
  version: t.literal('1'),
  stages: t.array(SequentialDelayStageSchema),
  address: eip712OptionalSchema(t.string),
  salt: eip712OptionalSchema(t.string),
})

/** io-ts schema for encoding and decoding SequentialDelayDomainOptions structs */
export const SequentialDelayDomainOptionsSchema: t.Type<SequentialDelayDomainOptions> = t.strict({
  signature: eip712OptionalSchema(t.string),
  nonce: eip712OptionalSchema(t.number),
})

/** io-ts schema for encoding and decoding SequentialDelayDomainState structs */
export const SequentialDelayDomainStateSchema: t.Type<SequentialDelayDomainState> = t.strict({
  timer: t.number,
  counter: t.number,
  disabled: t.boolean,
})

export const isSequentialDelayDomain = (domain: Domain): domain is SequentialDelayDomain =>
  domain.name === DomainIdentifiers.SequentialDelay && domain.version === '1'

export const sequentialDelayDomainEIP712Types: EIP712TypesWithPrimary = {
  types: {
    SequentialDelayDomain: [
      { name: 'address', type: 'Optional<address>' },
      { name: 'name', type: 'string' },
      { name: 'salt', type: 'Optional<string>' },
      { name: 'stages', type: 'SequentialDelayStage[]' },
      { name: 'version', type: 'string' },
    ],
    SequentialDelayStage: [
      { name: 'batchSize', type: 'Optional<uint256>' },
      { name: 'delay', type: 'uint256' },
      { name: 'repetitions', type: 'Optional<uint256>' },
      { name: 'resetTimer', type: 'Optional<bool>' },
    ],
    ...eip712OptionalType('address'),
    ...eip712OptionalType('string'),
    ...eip712OptionalType('uint256'),
    ...eip712OptionalType('bool'),
  },
  primaryType: 'SequentialDelayDomain',
}

export const sequentialDelayDomainOptionsEIP712Types: EIP712TypesWithPrimary = {
  types: {
    SequentialDelayDomainOptions: [
      { name: 'nonce', type: 'Optional<uint256>' },
      { name: 'signature', type: 'Optional<string>' },
    ],
    ...eip712OptionalType('string'),
    ...eip712OptionalType('uint256'),
  },
  primaryType: 'SequentialDelayDomainOptions',
}

/** Result values of the sequential delay domain rate limiting function */
export interface SequentialDelayResult {
  /** Whether or not a request will be accepted at the given time */
  accepted: boolean
  /**
   * Earliest time a request will be accepted at the current stage.
   * Provided on rejected requests. Undefined if a request will never be accepted.
   */
  notBefore?: number
  /** State after applying adding a query to the quota. Unchnaged is accepted is false */
  state: SequentialDelayDomainState | undefined
}

interface IndexedSequentialDelayStage extends SequentialDelayStage {
  // The attempt number at which the stage begins
  start: number
}

/**
 * Rate limiting predicate for the sequential delay domain
 *
 * @param domain SequentialDelayDomain instance against which the rate limit is being calculated.
 *  The domain instance supplied the rate limiting parameters.
 * @param attemptTime The Unix timestamp in seconds when the request was received.
 * @param state The current state of the domain, endoing the used quota and timeer value.
 */
export const checkSequentialDelayRateLimit = (
  domain: SequentialDelayDomain,
  attemptTime: number,
  state?: SequentialDelayDomainState
): SequentialDelayResult => {
  // If the domain has been disabled, all queries are to be rejected.
  if (state?.disabled ?? false) {
    return { accepted: false, state }
  }

  // If no state is available (i.e. this is the first request against the domain) use the initial state.
  const counter = state?.counter ?? 0
  const timer = state?.timer ?? 0
  const stage = getIndexedStage(domain, counter)

  // If the counter is past the last stage (i.e. the domain is permanently out of quota) return early.
  if (!stage) {
    return { accepted: false, state }
  }

  const resetTimer = stage.resetTimer.defined ? stage.resetTimer.value : true
  const delay = getDelay(stage, counter)
  const notBefore = timer + delay

  if (attemptTime < notBefore) {
    return { accepted: false, notBefore, state }
  }

  // Request is accepted. Update the state.
  return {
    accepted: true,
    state: {
      counter: counter + 1,
      timer: resetTimer ? attemptTime : notBefore,
      disabled: state?.disabled ?? false,
    },
  }
}

const getIndexedStage = (
  domain: SequentialDelayDomain,
  counter: number
): IndexedSequentialDelayStage | undefined => {
  let attemptsInStage = 0
  let index = 0
  let start = 0
  while (start <= counter) {
    if (index >= domain.stages.length) {
      return undefined
    }
    const stage = domain.stages[index]
    const repetitions = stage.repetitions.defined ? stage.repetitions.value : 1
    const batchSize = stage.batchSize.defined ? stage.batchSize.value : 1
    attemptsInStage = repetitions * batchSize
    start += attemptsInStage
    index++
  }

  start -= attemptsInStage
  index--

  return { ...domain.stages[index], start }
}

const getDelay = (stage: IndexedSequentialDelayStage, counter: number): number => {
  const batchSize = stage.batchSize.defined ? stage.batchSize.value : 1
  if ((counter - stage.start) % batchSize === 0) {
    return stage.delay
  }
  return 0
}
