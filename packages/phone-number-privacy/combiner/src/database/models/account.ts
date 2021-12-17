import { VerifiedPhoneNumberDekSignature } from '../../match-making/get-contact-matches'

export const ACCOUNTS_TABLE = 'accounts'
export enum ACCOUNTS_COLUMNS {
  address = 'address',
  signedUserPhoneNumber = 'signedUserPhoneNumber',
  dekSigner = 'dekSigner',
  createdAt = 'created_at',
  numLookups = 'num_lookups',
  didMatchmaking = 'did_matchmaking',
}
export class Account {
  [ACCOUNTS_COLUMNS.address]: string;
  [ACCOUNTS_COLUMNS.signedUserPhoneNumber]: string;
  [ACCOUNTS_COLUMNS.dekSigner]: string;
  [ACCOUNTS_COLUMNS.createdAt]: Date = new Date();
  [ACCOUNTS_COLUMNS.didMatchmaking]: Date | null = null

  constructor(address: string, verifiedPhoneNumberDekSig?: VerifiedPhoneNumberDekSignature) {
    this.address = address
    if (verifiedPhoneNumberDekSig) {
      this.signedUserPhoneNumber = verifiedPhoneNumberDekSig.signedUserPhoneNumber
      this.dekSigner = verifiedPhoneNumberDekSig.dekSigner
    }
  }
}
