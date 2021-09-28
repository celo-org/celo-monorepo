export const DOMAINS_TABLE = 'domains'
export enum DOMAINS_COLUMNS {
  domain = 'domain',
  counter = 'counter',
  timer = 'timer',
  disabled = 'disabled',
}
export class Domain {
  [DOMAINS_COLUMNS.domain]: string;
  [DOMAINS_COLUMNS.counter]: number;
  [DOMAINS_COLUMNS.timer]: number;
  [DOMAINS_COLUMNS.disabled]: boolean

  constructor(domain: string, counter: number, timer: number) {
    this[DOMAINS_COLUMNS.domain] = domain
    this[DOMAINS_COLUMNS.counter] = counter
    this[DOMAINS_COLUMNS.timer] = timer
    this[DOMAINS_COLUMNS.disabled] = false
  }
}
