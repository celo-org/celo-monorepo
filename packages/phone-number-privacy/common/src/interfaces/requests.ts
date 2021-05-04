export interface GetBlindedMessageSigRequest {
  account: string
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string
  sessionID?: string
}

// TODO(Alec): add comment explaining the naming conventions below
export interface GetContactMatchesRequest {
  account: string
  userPhoneNumber: string
  contactPhoneNumbers: string[]
  hashedPhoneNumber: string
  blindedPhoneNumber: string
  sessionID?: string
}

export interface GetQuotaRequest {
  account: string
  hashedPhoneNumber?: string
  sessionID?: string
}
