import { SequentialDelayDomainState } from '@celo/phone-number-privacy-common'
import { DOMAINS_STATES_COLUMNS, DomainState } from '../../database/models/domainState'

export function toSequentialDelayDomainState(domainState: DomainState): SequentialDelayDomainState {
  return {
    domainHash: domainState[DOMAINS_STATES_COLUMNS.domainHash],
    counter: domainState[DOMAINS_STATES_COLUMNS.counter]!,
    timer: domainState[DOMAINS_STATES_COLUMNS.timer]!,
    disabled: domainState[DOMAINS_STATES_COLUMNS.disabled]!,
  }
}
