import { Domain, domainHash, isSequentialDelayDomain } from '@celo/identity/lib/odis/domains'
import { SequentialDelayDomainState, WarningMessage } from '@celo/phone-number-privacy-common'

export const DOMAINS_STATES_TABLE = 'domainsStates'
export enum DOMAINS_STATES_COLUMNS {
  domainHash = 'domainHash',
  counter = 'counter',
  timer = 'timer',
  disabled = 'disabled',
}
export class DomainState {
  public static createEmptyDomainState(domain: Domain): DomainState {
    if (isSequentialDelayDomain(domain)) {
      return {
        [DOMAINS_STATES_COLUMNS.domainHash]: domainHash(domain).toString('hex'),
        [DOMAINS_STATES_COLUMNS.counter]: 0,
        [DOMAINS_STATES_COLUMNS.timer]: 0,
        [DOMAINS_STATES_COLUMNS.disabled]: false,
      }
    }

    throw new Error(WarningMessage.UNKNOWN_DOMAIN)
  }

  [DOMAINS_STATES_COLUMNS.domainHash]: string;
  [DOMAINS_STATES_COLUMNS.counter]: number | undefined;
  [DOMAINS_STATES_COLUMNS.timer]: number | undefined;
  [DOMAINS_STATES_COLUMNS.disabled]: boolean

  constructor(domainState: SequentialDelayDomainState) {
    this[DOMAINS_STATES_COLUMNS.domainHash] = domainState[DOMAINS_STATES_COLUMNS.domainHash]
    this[DOMAINS_STATES_COLUMNS.counter] = domainState[DOMAINS_STATES_COLUMNS.counter]
    this[DOMAINS_STATES_COLUMNS.timer] = domainState[DOMAINS_STATES_COLUMNS.timer]
    this[DOMAINS_STATES_COLUMNS.disabled] = domainState[DOMAINS_STATES_COLUMNS.disabled]
  }
}
