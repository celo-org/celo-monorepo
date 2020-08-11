import { GetBlindedMessageForSaltRequest } from '../../salt-generation/get-salt'

export const REQUESTS_TABLE = 'requests'
export enum REQUESTS_COLUMNS {
  address = 'caller_address',
  timestamp = 'timestamp',
  blindedQuery = 'blinded_query',
}
export class Request {
  [REQUESTS_COLUMNS.address]: string;
  [REQUESTS_COLUMNS.timestamp]: Date;
  [REQUESTS_COLUMNS.blindedQuery]: string

  constructor(request: GetBlindedMessageForSaltRequest) {
    this[REQUESTS_COLUMNS.address] = request.account
    this[REQUESTS_COLUMNS.timestamp] = new Date(request.timestamp as number)
    this[REQUESTS_COLUMNS.blindedQuery] = request.blindedQueryPhoneNumber
  }
}
