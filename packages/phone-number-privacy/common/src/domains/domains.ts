import {
  EIP712Object,
  EIP712ObjectValue,
  EIP712TypedData,
  EIP712TypesWithPrimary,
  generateTypedDataHash,
} from '@celo/utils/lib/sign-typed-data-utils'
import * as t from 'io-ts'
import {
  isSequentialDelayDomain,
  SequentialDelayDomain,
  sequentialDelayDomainEIP712Types,
  SequentialDelayDomainOptions,
  sequentialDelayDomainOptionsEIP712Types,
  SequentialDelayDomainSchema,
} from './sequential-delay'

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

/** Enum of identifiers (i.e. names) for all standardized domains */
export enum DomainIdentifiers {
  SequentialDelay = 'ODIS Sequential Delay Domain',
}

/**
 * Union type of domains which are currently implmented and standardized for use with ODIS.
 * Domains should be added to the union type as they are implemented.
 *
 * @remarks Additional domain types should be added to this type union as the are standardized.
 */
export type KnownDomain = SequentialDelayDomain

/** io-ts schema for encoding and decoding domains of any standardized type */
export const KnownDomainSchema: t.Type<KnownDomain> = SequentialDelayDomainSchema

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
 * @remarks Note that this is a simple wrapper to get the EIP-712 hash after encoding it to an
 * EIP-712 typed data format. If a signature over the domain is needed, encode to EIP-712 format
 * and pass that into a signTypedData function.
 */
export function domainHash(domain: KnownDomain): Buffer {
  return generateTypedDataHash(domainEIP712(domain))
}
