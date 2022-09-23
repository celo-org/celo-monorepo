// TODO EN: rename the var to reference that this is legacy
export const ACCOUNTS_TABLE = 'accounts'
export const ACCOUNTS_ONCHAIN_TABLE = 'accountsOnChain'

export enum ACCOUNTS_COLUMNS {
  address = 'address',
  createdAt = 'created_at',
  numLookups = 'num_lookups',
  didMatchmaking = 'did_matchmaking',
}
// export class Account {
//   [ACCOUNTS_COLUMNS.address]: string;
//   [ACCOUNTS_COLUMNS.createdAt]: Date = new Date();
//   [ACCOUNTS_COLUMNS.numLookups]: number = 0;
//   [ACCOUNTS_COLUMNS.didMatchmaking]: Date | null = null

//   constructor(address: string) {
//     this.address = address
//   }
// }

export interface AccountRecord {
  [ACCOUNTS_COLUMNS.address]: string
  [ACCOUNTS_COLUMNS.createdAt]: Date
  [ACCOUNTS_COLUMNS.numLookups]: number
  [ACCOUNTS_COLUMNS.didMatchmaking]: Date | null
}

export function toAccountRecord(account: string, numLookups: number): AccountRecord {
  return {
    [ACCOUNTS_COLUMNS.address]: account,
    [ACCOUNTS_COLUMNS.createdAt]: new Date(),
    [ACCOUNTS_COLUMNS.numLookups]: numLookups,
    [ACCOUNTS_COLUMNS.didMatchmaking]: null,
  }
}
