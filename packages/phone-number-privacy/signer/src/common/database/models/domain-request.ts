import { Domain, domainHash } from '@celo/phone-number-privacy-common'

export const DOMAIN_REQUESTS_TABLE = 'domainRequests'
export enum DOMAIN_REQUESTS_COLUMNS {
  domainHash = 'domainHash',
  timestamp = 'timestamp',
  blindedMessage = 'blinded_message',
}

export interface DomainRequestRecord {
  [DOMAIN_REQUESTS_COLUMNS.domainHash]: string
  [DOMAIN_REQUESTS_COLUMNS.timestamp]: Date
  [DOMAIN_REQUESTS_COLUMNS.blindedMessage]: string
}

export function toDomainRequestRecord<D extends Domain>(
  domain: D,
  blindedMessage: string
): DomainRequestRecord {
  return {
    [DOMAIN_REQUESTS_COLUMNS.domainHash]: domainHash(domain).toString('hex'),
    [DOMAIN_REQUESTS_COLUMNS.timestamp]: new Date(),
    [DOMAIN_REQUESTS_COLUMNS.blindedMessage]: blindedMessage,
  }
}
