export const DOMAINS_STATES_TABLE = 'domainsStates'
export enum DOMAINS_STATES_COLUMNS {
  domainHash = 'domainHash',
  counter = 'counter',
  timer = 'timer',
  disabled = 'disabled',
}
export class DomainState {
  [DOMAINS_STATES_COLUMNS.domainHash]: string;
  [DOMAINS_STATES_COLUMNS.counter]: number | undefined;
  [DOMAINS_STATES_COLUMNS.timer]: number | undefined;
  [DOMAINS_STATES_COLUMNS.disabled]: boolean

  constructor(domainState: DomainState) {
    this[DOMAINS_STATES_COLUMNS.domainHash] = domainState[DOMAINS_STATES_COLUMNS.domainHash]
    this[DOMAINS_STATES_COLUMNS.counter] = domainState[DOMAINS_STATES_COLUMNS.counter]
    this[DOMAINS_STATES_COLUMNS.timer] = domainState[DOMAINS_STATES_COLUMNS.timer]
    this[DOMAINS_STATES_COLUMNS.disabled] = domainState[DOMAINS_STATES_COLUMNS.disabled]
  }
}
