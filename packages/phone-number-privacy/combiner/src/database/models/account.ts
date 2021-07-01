export const ACCOUNTS_TABLE = 'accounts'
export enum ACCOUNTS_COLUMNS {
  address = 'address',
  signedUserPhoneNumber = 'signedUserPhoneNumber',
  createdAt = 'created_at',
  numLookups = 'num_lookups',
  didMatchmaking = 'did_matchmaking',
}
export class Account {
  [ACCOUNTS_COLUMNS.address]: string;
  [ACCOUNTS_COLUMNS.signedUserPhoneNumber]: string;
  [ACCOUNTS_COLUMNS.createdAt]: Date = new Date();
  [ACCOUNTS_COLUMNS.didMatchmaking]: Date | null = null

  constructor(address: string, signedUserPhoneNumber?: string) {
    this.address = address
    if (signedUserPhoneNumber) {
      this.signedUserPhoneNumber = signedUserPhoneNumber
    }
  }
}
