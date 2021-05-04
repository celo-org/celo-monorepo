export const ACCOUNTS_TABLE = 'accounts'
export enum ACCOUNTS_COLUMNS {
  address = 'address',
  blindedPhoneNumber = 'blindedPhoneNumber',
  createdAt = 'created_at',
  numLookups = 'num_lookups',
  didMatchmaking = 'did_matchmaking',
}
export class Account {
  [ACCOUNTS_COLUMNS.address]: string;
  [ACCOUNTS_COLUMNS.blindedPhoneNumber]: string;
  [ACCOUNTS_COLUMNS.createdAt]: Date = new Date();
  [ACCOUNTS_COLUMNS.didMatchmaking]: Date | null = null

  constructor(address: string, blindedPhoneNumber: string) {
    this.address = address
    this.blindedPhoneNumber = blindedPhoneNumber
  }
}
