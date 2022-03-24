import { Domain, domainHash } from '@celo/phone-number-privacy-common'

export const DOMAIN_REQUESTS_TABLE = 'domainRequests'
export enum DOMAIN_REQUESTS_COLUMNS {
  domainHash = 'domainHash',
  timestamp = 'timestamp',
  blindedMessage = 'blinded_message',
}
export class DomainSigRequestRecord {
  [DOMAIN_REQUESTS_COLUMNS.domainHash]: string;
  [DOMAIN_REQUESTS_COLUMNS.timestamp]: Date;
  [DOMAIN_REQUESTS_COLUMNS.blindedMessage]: string

  constructor(domain: Domain, blindedMessage: string) {
    this[DOMAIN_REQUESTS_COLUMNS.domainHash] = domainHash(domain).toString('hex')
    this[DOMAIN_REQUESTS_COLUMNS.timestamp] = new Date()
    this[DOMAIN_REQUESTS_COLUMNS.blindedMessage] = blindedMessage
  }
}
