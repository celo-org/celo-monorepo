import {
  Domain,
  domainHash,
  DomainState,
  SequentialDelayDomainState,
} from '@celo/phone-number-privacy-common/lib/domains'

export const DOMAIN_STATE_TABLE = 'domainState'
export enum DOMAIN_STATE_COLUMNS {
  domainHash = 'domainHash',
  counter = 'counter',
  timer = 'timer',
  disabled = 'disabled',
}

export interface DomainStateRecord {
  [DOMAIN_STATE_COLUMNS.domainHash]: string
  [DOMAIN_STATE_COLUMNS.disabled]: boolean
  [DOMAIN_STATE_COLUMNS.counter]: number
  [DOMAIN_STATE_COLUMNS.timer]: number
}

export function toDomainStateRecord<D extends Domain>(
  domain: D,
  domainState: DomainState<D>
): DomainStateRecord {
  return {
    [DOMAIN_STATE_COLUMNS.domainHash]: domainHash(domain).toString('hex'),
    [DOMAIN_STATE_COLUMNS.disabled]: domainState.disabled,
    [DOMAIN_STATE_COLUMNS.counter]: domainState.counter,
    [DOMAIN_STATE_COLUMNS.timer]: domainState.timer,
  }
}

export function toSequentialDelayDomainState(
  record: DomainStateRecord,
  attemptTime?: number
): SequentialDelayDomainState {
  return {
    disabled: record[DOMAIN_STATE_COLUMNS.disabled],
    counter: record[DOMAIN_STATE_COLUMNS.counter],
    timer: record[DOMAIN_STATE_COLUMNS.timer],
    // Timestamp precision is lowered to seconds to reduce the chance of effective timing attacks.
    now: attemptTime ?? Math.floor(Date.now() / 1000),
  }
}
