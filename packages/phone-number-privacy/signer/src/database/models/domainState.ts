import { SequentialDelayDomainState, WarningMessage } from '@celo/phone-number-privacy-common'
import {
  Domain,
  domainHash,
  isSequentialDelayDomain,
} from '@celo/phone-number-privacy-common/lib/domains'

export const DOMAINS_STATES_TABLE = 'domainsStates'
export enum DOMAINS_STATES_COLUMNS {
  domainHash = 'domainHash',
  counter = 'counter',
  timer = 'timer',
  disabled = 'disabled',
}
export class DomainStateRecord {
  public static createEmptyDomainState(domain: Domain): DomainStateRecord {
    if (isSequentialDelayDomain(domain)) {
      return {
        [DOMAINS_STATES_COLUMNS.domainHash]: domainHash(domain).toString('hex'),
        [DOMAINS_STATES_COLUMNS.counter]: 0,
        [DOMAINS_STATES_COLUMNS.timer]: 0,
        [DOMAINS_STATES_COLUMNS.disabled]: false,
      }
    }

    // canary provides a compile-time check that all subtypes of Domain have branches. If a case
    // was missed, then an error will report that domain cannot be assigned to type `never`.
    const canary = (x: never) => x
    canary(domain)

    throw new Error(WarningMessage.UNKNOWN_DOMAIN)
  }

  [DOMAINS_STATES_COLUMNS.domainHash]: string;
  [DOMAINS_STATES_COLUMNS.counter]: number | undefined;
  [DOMAINS_STATES_COLUMNS.timer]: number | undefined;
  [DOMAINS_STATES_COLUMNS.disabled]: boolean

  constructor(hash: string, domainState: SequentialDelayDomainState) {
    this[DOMAINS_STATES_COLUMNS.domainHash] = hash
    this[DOMAINS_STATES_COLUMNS.counter] = domainState.counter
    this[DOMAINS_STATES_COLUMNS.timer] = domainState.timer
    this[DOMAINS_STATES_COLUMNS.disabled] = domainState.disabled
  }
}
