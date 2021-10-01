export const DOMAINS_STATES_TABLE = 'domainsStates'
export enum DOMAINS_STATES_COLUMNS {
  domain = 'domain',
  counter = 'counter',
  timer = 'timer',
  disabled = 'disabled',
}
export class DomainState {
  [DOMAINS_STATES_COLUMNS.domain]: string;
  [DOMAINS_STATES_COLUMNS.counter]: number;
  [DOMAINS_STATES_COLUMNS.timer]: number;
  [DOMAINS_STATES_COLUMNS.disabled]: boolean

  constructor(domain: string, counter: number, timer: number) {
    this[DOMAINS_STATES_COLUMNS.domain] = domain
    this[DOMAINS_STATES_COLUMNS.counter] = counter
    this[DOMAINS_STATES_COLUMNS.timer] = timer
    this[DOMAINS_STATES_COLUMNS.disabled] = false
  }
}
