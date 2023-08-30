export const REQUESTS_TABLE = 'requestsOnChain'

export enum REQUESTS_COLUMNS {
  address = 'caller_address',
  timestamp = 'timestamp',
  blindedQuery = 'blinded_query',
  signature = 'signature',
}

export interface PnpSignRequestRecord {
  [REQUESTS_COLUMNS.address]: string
  [REQUESTS_COLUMNS.timestamp]: Date
  [REQUESTS_COLUMNS.blindedQuery]: string
  [REQUESTS_COLUMNS.signature]: string | undefined
}

export function toPnpSignRequestRecord(
  account: string,
  blindedQuery: string,
  signature: string
): PnpSignRequestRecord {
  return {
    [REQUESTS_COLUMNS.address]: account,
    [REQUESTS_COLUMNS.timestamp]: new Date(),
    [REQUESTS_COLUMNS.blindedQuery]: blindedQuery,
    [REQUESTS_COLUMNS.signature]: signature,
  }
}
