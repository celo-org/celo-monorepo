export const ACCOUNTS_TABLE = 'accountsOnChain'

export enum ACCOUNTS_COLUMNS {
  address = 'address',
  createdAt = 'created_at',
  numLookups = 'num_lookups',
}

export interface AccountRecord {
  [ACCOUNTS_COLUMNS.address]: string
  [ACCOUNTS_COLUMNS.createdAt]: Date
  [ACCOUNTS_COLUMNS.numLookups]: number
}

export function toAccountRecord(account: string, numLookups: number): AccountRecord {
  return {
    [ACCOUNTS_COLUMNS.address]: account,
    [ACCOUNTS_COLUMNS.createdAt]: new Date(),
    [ACCOUNTS_COLUMNS.numLookups]: numLookups,
  }
}
