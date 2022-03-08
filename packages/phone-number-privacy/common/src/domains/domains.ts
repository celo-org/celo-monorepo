import {
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
  SequentialDelayDomainState,
} from './sequential-delay'

/**
 * Union type of domains which are currently implmented and standardized for use with ODIS.
 * Domains should be added to the union type as they are implemented.
 *
 * @remarks Additional domain types should be added to this type union as they are standardized.
 *
 * All new Domain types must contain the fields { name: string, version: string }. Domain types
 * may have additional fields, which must be assignable to EIP712Value. See CIP-40 for more details:
 *
 * https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0040.md#extension-for-domain-restricted-requests
 */
export type Domain = SequentialDelayDomain

/**
 * Parameterized union type of standardized domain options.
 *
 * @remarks If the type parameter is specified to be a concrete Domain subtype, then only its
 * associated DomainOptions is selected and assignable to the parameterized type.
 *
 * Additional domain options types should be added to this type union along with the new domain type
 * definition, if the new domain type has associated options. If a domain type has no associated
 * options, it's corresponding options type should be an empty struct.
 *
 * Domain options must be assignable to EIP712Object.
 */
export type DomainOptions<D extends Domain = Domain> = D extends SequentialDelayDomain
  ? SequentialDelayDomainOptions
  : never

/**
 * Parameterized union type of currently implemented and standarized domain state structs. If the
 * type parameter is specified to be a concrete Domain subtype, then only its associated
 * Domain state type is selected and assignable to the parameterized type.
 */
export type DomainState<D extends Domain = Domain> = D extends SequentialDelayDomain
  ? SequentialDelayDomainState
  : never

/** io-ts schema for encoding and decoding domains of any standardized type */
export const DomainSchema: t.Type<Domain> = SequentialDelayDomainSchema

export function domainEIP712Types(domain: Domain): EIP712TypesWithPrimary {
  if (isSequentialDelayDomain(domain)) {
    return sequentialDelayDomainEIP712Types
  }

  // canary provides a compile-time check that all subtypes of Domain have branches. If a case
  // was missed, then an error will report that domain cannot be assigned to type `never`.
  const canary = (x: never) => x
  canary(domain)
  throw new Error('Implementation error. Input of type Domain was not recognized')
}

export function domainOptionsEIP712Types(domain: Domain): EIP712TypesWithPrimary {
  if (isSequentialDelayDomain(domain)) {
    return sequentialDelayDomainOptionsEIP712Types
  }

  // canary provides a compile-time check that all subtypes of Domain have branches. If a case
  // was missed, then an error will report that domain cannot be assigned to type `never`.
  const canary = (x: never) => x
  canary(domain)
  throw new Error('Implementation error. Input of type Domain was not recognized')
}

/**
 * Wraps a domain instance of a standardized type into an EIP-712 typed data structure, including
 * the EIP-712 type signature specififed by the mapping from TypeScript types in CIP-40.
 * https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0040.md#mapping-typescript-to-eip-712-types
 */
export const domainEIP712 = (domain: Domain): EIP712TypedData => ({
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
export function domainHash(domain: Domain): Buffer {
  return generateTypedDataHash(domainEIP712(domain))
}
