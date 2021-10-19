import { Domain, isSequentialDelayDomain } from '@celo/identity/lib/odis/domains'
import { checkSequentialDelay } from '@celo/phone-number-privacy-common/lib/domains/sequential-delay'
import Logger from 'bunyan'

import { DomainState } from '../../database/models/domainState'
import { updateDomainState } from '../../database/wrappers/domainState'
import { UnsupportedDomainError } from '../unsupportedDomain.error'
import { IDomainQuotaService } from './domainQuota.interface'
import { toSequentialDelayDomainState } from '../../common/domain/domainState.mapper'
import { Transaction } from 'knex'

export class DomainQuotaService implements IDomainQuotaService {
  constructor(private logger: Logger) {}

  public async doesHaveRemainingQuota(domain: Domain, domainState: DomainState): Promise<boolean> {
    if (isSequentialDelayDomain(domain)) {
      return checkSequentialDelay(domain, Date.now(), toSequentialDelayDomainState(domainState))
        .accepted
    } else {
      throw new UnsupportedDomainError()
    }
  }

  public async increaseQuotaCount(
    domain: Domain,
    domainState: DomainState,
    trx: Transaction<DomainState>
  ): Promise<boolean> {
    if (isSequentialDelayDomain(domain)) {
      const result = checkSequentialDelay(
        domain,
        Date.now(),
        toSequentialDelayDomainState(domainState)
      )
      if (!result.state) {
        return false
      }

      return updateDomainState(
        domain,
        trx,
        result.state.counter!,
        result.state.timer!,
        this.logger
      ).then(() => true)
    } else {
      throw new UnsupportedDomainError()
    }
  }
}
