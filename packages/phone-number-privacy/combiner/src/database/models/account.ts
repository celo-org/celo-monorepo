export const ACCOUNTS_TABLE = 'accounts'

export enum ACCOUNTS_COLUMNS {
  address = 'address',
  createdAt = 'created_at',
  dek = 'dek',
  onChainDataLastUpdated = 'onChainDataLastUpdated',
}

export class Account {
  [ACCOUNTS_COLUMNS.address]: string | undefined;
  [ACCOUNTS_COLUMNS.createdAt]: Date = new Date();
  [ACCOUNTS_COLUMNS.dek]: string | undefined;
  [ACCOUNTS_COLUMNS.onChainDataLastUpdated]: Date | null = null

  constructor(address: string, dek?: string) {
    this.address = address
    if (dek) {
      this.dek = dek
    }
  }
}
