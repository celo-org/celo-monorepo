import {
  checkSequentialDelayRateLimit,
  Domain,
  ErrorMessage,
  isSequentialDelayDomain,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Transaction } from 'knex'
import { DomainStateRecord } from '../../database/models/domainState'
import { updateDomainStateRecord } from '../../database/wrappers/domainState'

export interface IDomainQuotaService {
  checkAndUpdateQuota: (
    domain: Domain,
    domainState: DomainStateRecord,
    trx: Transaction<DomainStateRecord>,
    logger: Logger
  ) => Promise<{ sufficient: boolean; state: DomainStateRecord }>
}

export class DomainQuotaService implements IDomainQuotaService {
  public async checkAndUpdateQuota(
    domain: Domain,
    domainStateRecord: DomainStateRecord,
    trx: Transaction<DomainStateRecord>,
    logger: Logger
  ): Promise<{ sufficient: boolean; state: DomainStateRecord }> {
    if (isSequentialDelayDomain(domain)) {
      const result = checkSequentialDelayRateLimit(
        domain,
        Date.now() / 1000, // Divide by 1000 to convert the current time in ms to seconds.
        domainStateRecord.toSequentialDelayDomainState()
      )
      if (result.accepted) {
        const state = new DomainStateRecord(domain, result.state)
        // Persist the updated domain quota to the database.
        // This will trigger an insert if its the first update to the domain instance.
        await updateDomainStateRecord(domain, state, trx, logger)
        return { sufficient: true, state }
      }
      // If the result was rejected, the domainStateRecord does not change
      return { sufficient: false, state: domainStateRecord }
    } else {
      throw new Error(ErrorMessage.UNSUPPORTED_DOMAIN)
    }
  }
}
