export enum RecipientVerificationStatus {
  UNVERIFIED = 0,
  VERIFIED = 1,
  UNKNOWN = 2,
}

export enum VerificationStatus {
  SaltQuotaExceeded = -3,
  InsufficientBalance = -2,
  Failed = -1,
  Stopped = 0,
  Prepping = 1,
  GettingStatus = 2,
  RequestingAttestations = 3,
  RevealingNumber = 4,
  RevealAttemptFailed = 5,
  Done = 6,
}

export enum ImportContactsStatus {
  Failed = -1,
  Stopped = 0,
  Prepping = 1,
  Importing = 2,
  Processing = 3,
  Matchmaking = 4,
  Done = 5,
}

// Contacts that have been matched during the onboarding matchmaking process
export interface ContactMatches {
  [e164Number: string]: { contactId: string }
}
