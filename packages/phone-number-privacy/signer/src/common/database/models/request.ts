// TODO EN: rename vars to indicate that these are legacy request tables
export const REQUESTS_TABLE = 'requests'
export const REQUESTS_ONCHAIN_TABLE = 'requestsOnChain'

export enum REQUESTS_COLUMNS {
  address = 'caller_address',
  timestamp = 'timestamp',
  blindedQuery = 'blinded_query',
}

// // TODO EN: rename something better like LegacyPnpRequestRecord
// // Note EN: this is literally just creating an object structured like the expected record
// export class Request {
//   [REQUESTS_COLUMNS.address]: string;
//   [REQUESTS_COLUMNS.timestamp]: Date;
//   [REQUESTS_COLUMNS.blindedQuery]: string

//   constructor(request: SignMessageRequest) {
//     this[REQUESTS_COLUMNS.address] = request.account
//     this[REQUESTS_COLUMNS.timestamp] = new Date()
//     this[REQUESTS_COLUMNS.blindedQuery] = request.blindedQueryPhoneNumber
//   }
// }

// NOTE EN: in theory both of the below could be shared as long as the requests columns are also shared
// then just the table itself is different and can be passed in as a param itself

export interface PnpSignRequestRecord {
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
