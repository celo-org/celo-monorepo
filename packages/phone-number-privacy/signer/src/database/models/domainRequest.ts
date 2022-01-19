import {
  domainHash,
  DomainRestrictedSignatureRequest,
  KnownDomain,
} from '@celo/phone-number-privacy-common'

export const DOMAIN_REQUESTS_TABLE = 'domainRequests'
export enum DOMAIN_REQUESTS_COLUMNS {
  domainHash = 'domainHash',
  timestamp = 'timestamp',
  blindedMessage = 'blinded_message',
}
export class DomainRequest {
  [DOMAIN_REQUESTS_COLUMNS.domainHash]: string;
  [DOMAIN_REQUESTS_COLUMNS.timestamp]: Date;
  [DOMAIN_REQUESTS_COLUMNS.blindedMessage]: string

  constructor(request: DomainRestrictedSignatureRequest<KnownDomain>) {
    this[DOMAIN_REQUESTS_COLUMNS.domainHash] = domainHash(request.domain).toString('hex')
    this[DOMAIN_REQUESTS_COLUMNS.timestamp] = new Date()
    this[DOMAIN_REQUESTS_COLUMNS.blindedMessage] = request.blindedMessage
  }
}
