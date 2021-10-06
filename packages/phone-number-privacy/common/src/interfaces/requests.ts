import { Domain, DomainOptions } from '@celo/identity/lib/odis/domains'
import { Optional } from '@celo/utils/lib/sign-typed-data-utils'

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
  O extends DomainOptions = never
> = OmitIfNever<{
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
}>

export type DomainQuotaStatusRequest<
  D extends Domain = Domain,
  O extends DomainOptions = never
> = OmitIfNever<{
  /** Domain specification. Selects the PRF domain and rate limiting rules. */
  domain: D
  /** Domain-specific options. */
  options: O
  /** Client-specified session ID. */
  sessionID: Optional<string>
}>

export type DisableDomainRequest<
  D extends Domain = Domain,
  O extends DomainOptions = never
> = OmitIfNever<{
  /** Domain specification. Selects the PRF domain and rate limiting rules. */
  domain: D
  /** Domain-specific options. */
  options: O
  /** Client-specified session ID. */
  sessionID: Optional<string>
}>

// Use distributive conditional types to extract from the keys of T, keys with value type `never`.
// Eg. KeysOfTypeNever<{ foo: string, bar: never }, 'foo'|'bar'> = 'bar'
type KeysOfTypeNever<T, K extends keyof T> = K extends (T[K] extends never ? never : K) ? never : K

// Exclude all fields with value type `never` from T.
// Used above to exclude the 'option' field if its type is specified as `never` (i.e. no options).
type OmitIfNever<T> = Omit<T, KeysOfTypeNever<T, keyof T>>
