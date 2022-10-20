export const NUMBER_PAIRS_TABLE = 'number_pairs'
export enum NUMBER_PAIRS_COLUMN {
  userPhoneHash = 'user_phone_hash',
  contactPhoneHash = 'contact_phone_hash',
}

// This is to deal with a Typescript bug.
// https://github.com/microsoft/TypeScript/issues/49594
// Should revert to using the enum directly when this is fixed.
const userPhoneHashField = NUMBER_PAIRS_COLUMN.userPhoneHash
const contactPhoneHashField = NUMBER_PAIRS_COLUMN.contactPhoneHash

export class NumberPair {
  [userPhoneHashField]: string;
  [contactPhoneHashField]: string

  constructor(userPhoneHash: string, contactPhoneHash: string) {
    this[userPhoneHashField] = userPhoneHash
    this[contactPhoneHashField] = contactPhoneHash
  }
}
