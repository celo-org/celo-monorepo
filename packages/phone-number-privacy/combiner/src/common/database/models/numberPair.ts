export const NUMBER_PAIRS_TABLE = 'number_pairs'
export enum NUMBER_PAIRS_COLUMN {
  userPhoneHash = 'user_phone_hash',
  contactPhoneHash = 'contact_phone_hash',
}

export class NumberPair {
  [NUMBER_PAIRS_COLUMN.userPhoneHash]: string;
  [NUMBER_PAIRS_COLUMN.contactPhoneHash]: string

  constructor(userPhoneHash: string, contactPhoneHash: string) {
    this.user_phone_hash = userPhoneHash
    this.contact_phone_hash = contactPhoneHash
  }
}
