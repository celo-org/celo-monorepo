import { Model } from './model'

export const ACCOUNTS_TABLE = 'accounts'
export enum ACCOUNTS_COLUMNS {
  address = 'address',
  createdAt = 'created_at',
  numLookups = 'num_lookups',
  didMatchmaking = 'did_matchmaking',
}

export class Account extends Model {
  address: string
  createdAt: number = Date.now()
  numLookups: number = 0
  didMatchmaking: number | null = null

  constructor(address: string) {
    super()
    // TODO validate address
    this.address = address
  }
}
