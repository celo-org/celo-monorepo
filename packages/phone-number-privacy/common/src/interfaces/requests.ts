import { EIP712Object } from '@celo/utils/lib/sign-typed-data-utils'
import { Domain } from '@celo/identity/lib/odis/domains'

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

export interface DomainRestrictedSignatureRequest {
  /**
   * Domain specification. Selects the PRF domain and rate limiting rules.
   */
  domain: Domain
  /**
   * Domain-specific options.
   * Used for inputs relevant to the domain, but not part of the domain string.
   * Example: { "authorization": <signature> } for an account-restricted domain.
   */
  options?: EIP712Object
  /** Query message. A blinded elliptic curve point encoded in base64. */
  blindedMessage: string
  /** Client-specified session ID. */
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

export type OdisRequest = GetBlindedMessageSigRequest | GetQuotaRequest | GetContactMatchesRequest
