import { Optional } from '@celo/utils/lib/sign-typed-data-utils'
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

interface _DomainRestrictedSignatureRequest<D extends Domain, O extends DomainOptions = never> {
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

export type DomainRestrictedSignatureRequest<
  D extends Domain,
  O extends DomainOptions = never
> = never extends O
  ? Omit<_DomainRestrictedSignatureRequest<D>, 'options'>
  : _DomainRestrictedSignatureRequest<D, O>

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
