export const REQUESTS_TABLE = 'requests'

export enum REQUESTS_COLUMNS {
  address = 'caller_address',
  timestamp = 'timestamp',
  blindedQuery = 'blinded_query',
  combinedSignature = 'combined_signature',
  //TODO (soloseng): add session response too?
}

export interface PnpSignRequestRecord {
  [REQUESTS_COLUMNS.address]: string
  [REQUESTS_COLUMNS.timestamp]: Date
  [REQUESTS_COLUMNS.blindedQuery]: string
  [REQUESTS_COLUMNS.combinedSignature]: string
}

export function toPnpSignRequestRecord(
  account: string,
  blindedQuery: string,
  combinedSignature: string
): PnpSignRequestRecord {
  return {
    [REQUESTS_COLUMNS.address]: account,
    [REQUESTS_COLUMNS.timestamp]: new Date(),
    [REQUESTS_COLUMNS.blindedQuery]: blindedQuery,
    [REQUESTS_COLUMNS.combinedSignature]: combinedSignature,
  }
}
