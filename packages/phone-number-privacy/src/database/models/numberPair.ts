import { Model } from './model'

export const NUMBER_PAIRS_TABLE = 'number_pairs'
export enum NUMBER_PAIRS_COLUMN {
  userPhoneHash = 'user_phone_hash',
  contactPhoneHash = 'contact_phone_hash',
}

export class NumberPair extends Model {
  userPhoneHash: string
  contactPhoneHash: string

  constructor(userPhoneHash: string, contactPhoneHash: string) {
    super()
    this.userPhoneHash = userPhoneHash
    this.contactPhoneHash = contactPhoneHash
  }
}
