import { SequentialDelayDomainState } from '@celo/phone-number-privacy-common'
import { DomainStateRecord, DOMAINS_STATES_COLUMNS } from '../../database/models/domainState'

export function toSequentialDelayDomainState(
  domainState: DomainStateRecord
): SequentialDelayDomainState {
  return {
    counter: domainState[DOMAINS_STATES_COLUMNS.counter]!,
    timer: domainState[DOMAINS_STATES_COLUMNS.timer]!,
    disabled: domainState[DOMAINS_STATES_COLUMNS.disabled]!,
    date: 0, // TODO(Alec)
  }
}
