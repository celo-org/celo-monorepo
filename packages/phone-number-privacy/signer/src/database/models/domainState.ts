export const DOMAINS_STATES_TABLE = 'domainsStates'
export enum DOMAINS_STATES_COLUMNS {
  domainHash = 'domain_hash',
  counter = 'counter',
  timer = 'timer',
  disabled = 'disabled',
}
export class DomainState {
  [DOMAINS_STATES_COLUMNS.domainHash]: string;
  [DOMAINS_STATES_COLUMNS.counter]: number | null;
  [DOMAINS_STATES_COLUMNS.timer]: number | null;
  [DOMAINS_STATES_COLUMNS.disabled]: boolean | null

  constructor(domainHash: string, counter: number, timer: number) {
    this[DOMAINS_STATES_COLUMNS.domainHash] = domainHash
    this[DOMAINS_STATES_COLUMNS.counter] = counter
    this[DOMAINS_STATES_COLUMNS.timer] = timer
    this[DOMAINS_STATES_COLUMNS.disabled] = false
  }
}
