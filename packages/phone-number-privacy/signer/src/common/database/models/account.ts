export enum ACCOUNTS_TABLE {
  ONCHAIN = 'accountsOnChain',
  LEGACY = 'accounts',
}

export enum ACCOUNTS_COLUMNS {
  address = 'address',
  createdAt = 'created_at',
  numLookups = 'num_lookups',
  didMatchmaking = 'did_matchmaking',
}

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
