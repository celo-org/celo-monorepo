export const NETWORK = 'alfajores'

export type Address = string
export type E164Number = string

export enum RequestStatus {
  Pending = 'Pending',
  Working = 'Working',
  Done = 'Done',
  Failed = 'Failed',
}

export enum RequestType {
  Faucet = 'Faucet',
  Invite = 'Invite',
}

export enum MobileOS {
  android = 'android',
  ios = 'ios',
}

export interface RequestRecord {
  beneficiary: Address | E164Number
  status: RequestStatus
  type: RequestType
  mobileOS?: MobileOS // only on Invites
  dollarTxHash?: string
  goldTxHash?: string
  escrowTxHash?: string // only on Invites
}
