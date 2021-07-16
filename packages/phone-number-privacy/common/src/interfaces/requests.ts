export interface GetBlindedMessageSigRequest {
  account: string
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string // on-chain identifier
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
