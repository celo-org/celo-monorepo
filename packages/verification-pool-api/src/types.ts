export enum MessageState {
  DISPATCHING = 0, // Finding a verifier
  ASSIGNED = 1, // Verifier assigned
  SENT = 2, // Sent from verifier to user
  EXPIRED = 3, // Successfully sent but no confirmation for it on blockchain
  REWARDED = 4, // Verifier received verification rewards
}

export interface MobileVerifier {
  id: string // LOCAL ONLY, for convenience, not persisted to DB
  address?: string // Address to deposit verification reward to.
  fcmToken: string // Firebase Cloud Messaging Reg token from verification app.
  name: string // User's provided name
  phoneNum: string // Phone number of verification phone.
  supportedRegion: string // Country ISO code the user is willing to send to
  isVerifying: boolean // Has verification currently enabled
  attemptCount: number // number of times a request has dispatched without being acknowledged
}

export interface MobileVerifiersMap {
  [id: string]: MobileVerifier
}

export interface SMSMessage {
  phoneNum: string // Phone number to send verification code to.
  address: string // Address of new user
  message: string // Message to be sent from the verifier to the phone to be verified
  verifierId: string | null // Key of the verifier who successfully verified the message,
  verifierCandidates: string | null // List of verifier ids that have been selected for this message
  startTime: number // Timestamp when the service created the message
  finishTime: number | null // Timestamp when the SMS was sent or he service confirmed it failed. null if not yet finished
  messageState: MessageState // string representing the rewards distribution state of this message
}

export interface RewardableSMSMessage extends SMSMessage {
  id: string
  rewardToken: TokenType
}

export interface SMSMessagesMap {
  [id: string]: SMSMessage
}

export enum TokenType {
  GOLD = 'gold',
  DOLLAR = 'dollar',
}
