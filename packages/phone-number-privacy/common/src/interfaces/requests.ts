import { EIP712Object, Optional } from '@celo/utils/lib/sign-typed-data-utils'
import { Domain, DomainOptions } from '@celo/identity/lib/odis/domains'

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

// IDomainRestrictedSignatureRequest is the precursor for DomainRestrictedSignatureRequest.
// It requires the option field, which cannot be provided if a given domain has no options.
// Below, this options field is removed conditional on the options type being `never`.
interface IDomainRestrictedSignatureRequest<D extends Domain, O extends DomainOptions = never> {
  /**
   * Domain specification. Selects the PRF domain and rate limiting rules.
   */
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
  D extends Domain,
  O extends DomainOptions = never
> = never extends O
  ? Omit<IDomainRestrictedSignatureRequest<D>, 'options'>
  : IDomainRestrictedSignatureRequest<D, O>

// Compile-time check that Domain can be cast to type EIP712Object
export let TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712: EIP712Object
TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712 = ({} as unknown) as DomainRestrictedSignatureRequest<Domain>
TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712 = ({} as unknown) as DomainRestrictedSignatureRequest<
  Domain,
  DomainOptions
>

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

export type OdisRequest = GetBlindedMessageSigRequest | GetQuotaRequest | GetContactMatchesRequest
