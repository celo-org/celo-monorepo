import {
  Domain,
  domainEIP712Types,
  DomainOptions,
  domainOptionsEIP712Types,
  KnownDomain,
  KnownDomainOptions,
} from '@celo/identity/lib/odis/domains'
import {
  EIP712TypedData,
  Optional,
  optionalEIP712Type,
} from '@celo/utils/lib/sign-typed-data-utils'

export interface GetBlindedMessageSigRequest {
  /** Celo account address. Query is charged against this account's quota. */
  account: string
  /** Query message. A blinded elliptic curve point encoded in base64. */
  blindedQueryPhoneNumber: string
  /** Optional on-chain identifier. Unlocks additional quota if the account is verified as an owner of the identifier. */
  hashedPhoneNumber?: string // on-chain identifier
  /** Client-specified session ID for the request. */
  sessionID?: string
}

export interface GetContactMatchesRequest {
  account: string
  userPhoneNumber: string // obfuscated with deterministic salt
  contactPhoneNumbers: string[] // obfuscated with deterministic salt
  hashedPhoneNumber: string // on-chain identifier
  signedUserPhoneNumber?: string // signed with DEK
  sessionID?: string
}

export interface GetQuotaRequest {
  account: string
  hashedPhoneNumber?: string // on-chain identifier
  sessionID?: string
}

/**
 * Domain resitricted signature request to get a pOPRF evaluation on the given message in a given
 * domain, as specified by CIP-40.
 *
 * @remarks Concrete request types are created by specifying the type parameters for Domain and
 * DomainOptions. If a DomainOptions type parameter is specified, then the options field is
 * required. If not, it must not be provided.
 */
export type DomainRestrictedSignatureRequest<
  D extends Domain = Domain,
  O extends DomainOptions = D extends KnownDomain ? KnownDomainOptions<D> : never
> = OmitIfNever<
  {
    /** Domain specification. Selects the PRF domain and rate limiting rules. */
    domain: D
    /**
     * Domain-specific options.
     * Used for inputs relevant to the domain, but not part of the domain string.
     * Example: { "authorization": <signature> } for an account-restricted domain.
     */
    options: O
    /** Query message. A blinded elliptic curve point encoded in base64. */
    blindedMessage: string
    /** Client-specified session ID. */
    sessionID: Optional<string>
  },
  'options'
>

export function domainRestrictedSignatureRequestEIP712<D extends KnownDomain>(
  request: DomainRestrictedSignatureRequest<D, KnownDomainOptions<D>>
): EIP712TypedData {
  console.log(request.blindedMessage)
  const domainTypes = domainEIP712Types(request.domain)
  const optionsTypes = domainOptionsEIP712Types(request.domain)
  return {
    types: {
      DomainRestrictedSignatureRequest: [
        { name: 'blindedMessage', type: 'string' },
        { name: 'domain', type: domainTypes.primaryType },
        // Only include the `options` field in the EIP-712 type if there are options.
        ...(optionsTypes ? [{ name: 'options', type: optionsTypes.primaryType }] : []),
        { name: 'sessionID', type: 'Optional<string>' },
      ],
      ...domainTypes.types,
      ...optionsTypes?.types,
      ...optionalEIP712Type('string'),
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
      ],
    },
    primaryType: 'DomainRestrictedSignatureRequest',
    domain: {
      name: 'ODIS Domain Restricted Signature Request',
      version: '1',
    },
    message: request,
  }
}

export type DomainQuotaStatusRequest<
  D extends Domain = Domain,
  O extends DomainOptions = D extends KnownDomain ? KnownDomainOptions<D> : never
> = OmitIfNever<
  {
    /** Domain specification. Selects the PRF domain and rate limiting rules. */
    domain: D
    /** Domain-specific options. */
    options: O
    /** Client-specified session ID. */
    sessionID: Optional<string>
  },
  'options'
>

export type DisableDomainRequest<
  D extends Domain = Domain,
  O extends DomainOptions = D extends KnownDomain ? KnownDomainOptions<D> : never
> = OmitIfNever<
  {
    /** Domain specification. Selects the PRF domain and rate limiting rules. */
    domain: D
    /** Domain-specific options. */
    options: O
    /** Client-specified session ID. */
    sessionID: Optional<string>
  },
  'options'
>

// Use distributive conditional types to extract from the keys of T, keys with value type != never.
// Eg. AssignableKeys<{ foo: string, bar: never }, 'foo'|'bar'> = 'foo'
type AssignableKeys<T, K extends keyof T> = K extends (T[K] extends never ? never : K) ? K : never

// Exclude fields with value type `never` from T. If K is specified, only check those keys.
// Used above to exclude the 'option' field if its type is specified as `never` (i.e. no options).
// Eg. OmitIfNever<{ foo: string, bar: never, baz: never }, 'foo'|'bar'> = { foo: string, baz: never }
type OmitIfNever<T, K extends keyof T = keyof T> = Omit<T, K> & Pick<T, AssignableKeys<T, K>>
