import { Domain, isKnownDomain, isSequentialDelayDomain } from '@celo/identity/lib/odis/domains'
import { checkSequentialDelay } from '@celo/phone-number-privacy-common/lib/domains/sequential-delay'
import Logger from 'bunyan'

import { getDomainState, updateDomainState } from '../../database/wrappers/domainState'
import { UnknownDomainError } from '../unknownDomain.error'
import { UnsupportedDomainError } from '../unsupportedDomain.error'
import { IDomainQuotaService } from './domainQuota.interface'

export class DomainQuotaService implements IDomainQuotaService {
  constructor(private logger: Logger) {}

  public async doesHaveRemainingQuota(domain: Domain): Promise<boolean> {
    if (!isKnownDomain(domain)) {
      throw new UnknownDomainError()
    }

    if (isSequentialDelayDomain(domain)) {
      return getDomainState(domain, this.logger)
        .then(
          (state) => checkSequentialDelay(domain, Date.now(), state ? state : undefined).accepted
        )
        .catch((error) => {
          this.logger.error('Cannot query a quota', error)
          throw error
        })
    } else {
      throw new UnsupportedDomainError()
    }
  }

  public async increaseQuotaCount(domain: Domain): Promise<boolean> {
    if (!isKnownDomain(domain)) {
      throw new UnknownDomainError()
    }

    if (isSequentialDelayDomain(domain)) {
      return getDomainState(domain, this.logger)
        .then((state) => {
          const result = checkSequentialDelay(domain, Date.now(), state ? state : undefined)
          if (!result.state) {
            return false
          }

          return updateDomainState(
            domain,
            result.state.counter,
            result.state.timer,
            this.logger
          ).then(() => true)
        })
        .catch((error) => {
          this.logger.error('Cannot query a quota', error)
          throw error
        })
    } else {
      throw new UnsupportedDomainError()
    }
  }
}
