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
export class DomainStateRecord<D extends Domain = Domain> {
  [DOMAIN_STATE_COLUMNS.domainHash]: string;
  [DOMAIN_STATE_COLUMNS.disabled]: boolean;
  [DOMAIN_STATE_COLUMNS.counter]: number;
  [DOMAIN_STATE_COLUMNS.timer]: number

  constructor(domain: D, domainState: DomainState<D>) {
    this[DOMAIN_STATE_COLUMNS.domainHash] = domainHash(domain).toString('hex')
    this[DOMAIN_STATE_COLUMNS.disabled] = domainState.disabled
    this[DOMAIN_STATE_COLUMNS.counter] = domainState.counter
    this[DOMAIN_STATE_COLUMNS.timer] = domainState.timer
  }

  public toSequentialDelayDomainState(attemptTime?: number): SequentialDelayDomainState {
    return {
      disabled: this[DOMAIN_STATE_COLUMNS.disabled],
      counter: this[DOMAIN_STATE_COLUMNS.counter],
      timer: this[DOMAIN_STATE_COLUMNS.timer],
      // Timestamp precision is lowered to seconds to reduce the chance of effective timing attacks.
      now: attemptTime ?? Math.floor(Date.now() / 1000),
    }
  }
}
