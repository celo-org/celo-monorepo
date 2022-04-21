import { ErrorMessage } from '@celo/phone-number-privacy-common'
import { Domain, isSequentialDelayDomain } from '@celo/phone-number-privacy-common/lib/domains'
import { checkSequentialDelayRateLimit } from '@celo/phone-number-privacy-common/lib/domains/sequential-delay'
import Logger from 'bunyan'
import { Transaction } from 'knex'
import { toSequentialDelayDomainState } from '../../common/domain/domainState.mapper'
import { DOMAINS_STATES_COLUMNS, DomainStateRecord } from '../../database/models/domainState'
import { updateDomainState } from '../../database/wrappers/domainState'
import { IDomainQuotaService } from './domainQuota.interface'

export class DomainQuotaService implements IDomainQuotaService {
  public async checkAndUpdateQuota(
    domain: Domain,
    domainState: DomainStateRecord,
    trx: Transaction<DomainStateRecord>,
    logger: Logger
  ): Promise<{ sufficient: boolean; newState: DomainStateRecord }> {
    if (isSequentialDelayDomain(domain)) {
      return this.handleSequentialDelayDomain(domain, domainState, trx, logger)
    } else {
      throw new Error(ErrorMessage.UNSUPPORTED_DOMAIN)
    }
  }

  private async handleSequentialDelayDomain(
    domain: Domain,
    domainState: DomainStateRecord,
    trx: Transaction<DomainStateRecord>,
    logger: Logger
  ) {
    const result = checkSequentialDelayRateLimit(
      domain,
      // Divide by 1000 to convert the current time in ms to seconds.
      Date.now() / 1000,
      toSequentialDelayDomainState(domainState)
    )

    // If the result indicates insufficient quota, return a failure.
    // Note that the database will not be updated.
    if (!result.accepted || !result.state) {
      return { sufficient: false, newState: domainState }
    }

    // Convert the result to a database record.
    const newState: DomainStateRecord = {
      timer: result.state.timer,
      counter: result.state.counter,
      domainHash: domainState[DOMAINS_STATES_COLUMNS.domainHash],
      disabled: domainState[DOMAINS_STATES_COLUMNS.disabled],
    }

    // Persist the updated domain quota to the database.
    // This will trigger an insert if this is the first update to the domain.
    await updateDomainState(domain, newState, trx, logger)

    return {
      sufficient: true,
      newState,
    }
  }
}
