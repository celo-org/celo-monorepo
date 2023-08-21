export const REQUESTS_TABLE = 'requestsOnChain'

export enum REQUESTS_COLUMNS {
  address = 'caller_address',
  timestamp = 'timestamp',
  blindedQuery = 'blinded_query',
}

export interface PnpSignRequestRecord {
  //
  [REQUESTS_COLUMNS.address]: string
  [REQUESTS_COLUMNS.timestamp]: Date
  [REQUESTS_COLUMNS.blindedQuery]: string
}

export function toPnpSignRequestRecord(
  account: string,
  blindedQuery: string
): PnpSignRequestRecord {
  return {
    [REQUESTS_COLUMNS.address]: account,
    [REQUESTS_COLUMNS.timestamp]: new Date(),
    [REQUESTS_COLUMNS.blindedQuery]: blindedQuery,
  }
}
