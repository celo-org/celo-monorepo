import { isSequentialDelayDomain, KnownDomain } from '@celo/identity/lib/odis/domains'
import { ErrorMessage, SequentialDelayDomainState } from '@celo/phone-number-privacy-common'
import { checkSequentialDelay } from '@celo/phone-number-privacy-common/lib/domains/sequential-delay'
import Logger from 'bunyan'
import { Transaction } from 'knex'
import { toSequentialDelayDomainState } from '../../common/domain/domainState.mapper'
import { DOMAINS_STATES_COLUMNS, DomainState } from '../../database/models/domainState'
import { updateDomainState } from '../../database/wrappers/domainState'
import { IDomainQuotaService } from './domainQuota.interface'

export class DomainQuotaService implements IDomainQuotaService {
  public async checkAndUpdateQuota(
    domain: KnownDomain,
    domainState: DomainState,
    trx: Transaction<DomainState>,
    logger: Logger
  ): Promise<{ sufficient: boolean; newState: DomainState }> {
    if (isSequentialDelayDomain(domain)) {
      return this.handleSequentialDelayDomain(domain, domainState, trx, logger)
    } else {
      throw new Error(ErrorMessage.UNSUPPORTED_DOMAIN)
    }
  }

  private async handleSequentialDelayDomain(
    domain: KnownDomain,
    domainState: DomainState,
    trx: Transaction<DomainState>,
    logger: Logger
  ) {
    const result = checkSequentialDelay(
      domain,
      Date.now(),
      toSequentialDelayDomainState(domainState)
    )
    if (!result.accepted || !result.state) {
      return { sufficient: false, newState: domainState }
    }
    const newState: SequentialDelayDomainState = {
      timer: result.state.timer,
      counter: result.state.counter,
      domainHash: domainState[DOMAINS_STATES_COLUMNS.domainHash],
      disabled: domainState[DOMAINS_STATES_COLUMNS.disabled],
    }
    await updateDomainState(domain, newState, trx, logger)
    return {
      sufficient: true,
      newState,
    }
  }
}
