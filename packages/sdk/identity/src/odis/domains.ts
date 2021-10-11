import {
  EIP712Object,
  EIP712ObjectValue,
  EIP712Optional,
  eip712OptionalType,
  EIP712TypedData,
  EIP712TypesWithPrimary,
  generateTypedDataHash,
} from '@celo/utils/lib/sign-typed-data-utils'

// Concrete Domain subtypes are only assignable to Domain and EIP712Object when using type instead
// of interface. Otherwise the compiler complains about a missing index signature.
// tslint:disable:interface-over-type-literal

/**
 * ODIS OPRF domain specifier type as described in CIP-40
 * https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0040.md
 */
export interface Domain {
  /** Unique name of the domain. (e.g. "ODIS Password Domain") */
  name: string
  /** Version number. Allows for backwards incompatible changes. */
  version: string
  /** Arbitrary key-value pairs. Must be serializeable to EIP-712 encoding. */
  [key: string]: EIP712ObjectValue
}

/**
 * Options that accompany a Domain in a request to ODIS. Concrete subtype is determined by the
 * concrete subtype of Domain.
 *
 * @remarks DomainOptions is simply an alias of EIP712Object.
 */
export type DomainOptions = EIP712Object

export type SequentialDelayStage = {
  // How many seconds each batch of attempts in this stage is delayed with
  // respect to the timer.
  delay: number
  // Whether the timer should be reset between attempts during this stage.
  // Defaults to true.
  resetTimer: EIP712Optional<boolean>
  // The number of continuous attempts a user gets before the next delay
  // in each repetition of this stage. Defaults to 1.
  batchSize: EIP712Optional<number>
  // The number of times this stage repeats before continuing to the next stage
  // in the RateLimit array. Defaults to 1.
  repetitions: EIP712Optional<number>
}

export type SequentialDelayDomain = {
  name: 'ODIS Sequential Delay Domain'
  version: '1'
  stages: SequentialDelayStage[]
  // Optional Celo address against which signed requests must be authenticated.
  // In the case of Cloud Backup, this will be derived from a one-time key stored with the ciphertext.
  address: EIP712Optional<string>
  // Optional string to distinguish the output of this domain instance from
  // other SequentialDelayDomain instances
  salt: EIP712Optional<string>
}

export type SequentialDelayDomainOptions = {
  // EIP-712 signature over the entire request by the address specified in the domain.
  // Required if `address` is defined in the domain instance. If `address` is
  // not defined in the domain instance, then a signature must not be provided.
  signature: EIP712Optional<string>
  // Used to prevent replay attacks. Required if a signature is provided.
  nonce: EIP712Optional<number>
}

export const isSequentialDelayDomain = (domain: Domain): domain is SequentialDelayDomain =>
  domain.name === 'ODIS Sequential Delay Domain' && domain.version === '1'

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

/**
 * Union type of domains which are currently implmented and standardized for use with ODIS.
 * Domains should be added to the union type as they are implemented.
 *
 * @remarks Additional domain types should be added to this type union as the are standardized.
 */
export type KnownDomain = SequentialDelayDomain

export function isKnownDomain(domain: Domain): domain is KnownDomain {
  return isSequentialDelayDomain(domain)
}

/**
 * Parameterized union type of currently implemented and standarized domain options. If the type
 * parameter is specified to be a concrete Domain subtype, then only its associated DomainOptions is
 * selected and assignable to the parameterized type.
 */
export type KnownDomainOptions<
  D extends KnownDomain = KnownDomain
> = D extends SequentialDelayDomain ? SequentialDelayDomainOptions : never

export function domainEIP712Types(domain: KnownDomain): EIP712TypesWithPrimary {
  if (isSequentialDelayDomain(domain)) {
    return sequentialDelayDomainEIP712Types
  }

  // canary provides a compile-time check that all subtypes of KnownDomain have branches. If a case
  // was missed, then an error will report that domain cannot be assigned to type `never`.
  const canary = (x: never) => x
  canary(domain)
  throw new Error('Implementation error. Input of type KnownDomain was not recognized')
}

export function domainOptionsEIP712Types(domain: KnownDomain): EIP712TypesWithPrimary | undefined {
  if (isSequentialDelayDomain(domain)) {
    return sequentialDelayDomainOptionsEIP712Types
  }

  // canary provides a compile-time check that all subtypes of KnownDomain have branches. If a case
  // was missed, then an error will report that domain cannot be assigned to type `never`.
  const canary = (x: never) => x
  canary(domain)
  throw new Error('Implementation error. Input of type KnownDomain was not recognized')
}

/**
 * Wraps a domain instance of a standardized type into an EIP-712 typed data structure, including
 * the EIP-712 type signature specififed by the mapping from TypeScript types in CIP-40.
 * https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0040.md#mapping-typescript-to-eip-712-types
 */
export const domainEIP712 = (domain: KnownDomain): EIP712TypedData => ({
  types: {
    ...domainEIP712Types(domain).types,
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
    ],
  },
  primaryType: domainEIP712Types(domain).primaryType,
  domain: {
    name: domain.name,
    version: domain.version,
  },
  message: domain,
})

/**
 * Produces the canonical 256-bit EIP-712 typed hash of the given domain.
 *
 * @remarks Note that this is a simple wraper to get the EIP-712 hash after encoding it to an
 * EIP-712 typed data format. If a signature over the domain is needed, enocide to EIP-712 format
 * and pass that into a signTypedData function.
 */
export function domainHash(domain: KnownDomain): Buffer {
  return generateTypedDataHash(domainEIP712(domain))
}
