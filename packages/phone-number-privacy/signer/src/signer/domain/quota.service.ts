import {
  checkSequentialDelayRateLimit,
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  isSequentialDelayDomain,
} from '@celo/phone-number-privacy-common'
import { Transaction } from 'knex'
import { DomainStateRecord } from '../../database/models/domainState'
import {
  getDomainStateRecordOrEmpty,
  updateDomainStateRecord,
} from '../../database/wrappers/domainState'
import { IQuotaService, OdisQuotaStatusResult } from '../quota.interface'
import { DomainSession } from './session'

declare type QuotaDependentDomainRequest =
  | DomainQuotaStatusRequest
  | DomainRestrictedSignatureRequest

export class DomainQuotaService implements IQuotaService<QuotaDependentDomainRequest> {
  public async checkAndUpdateQuotaStatus(
    state: DomainStateRecord,
    session: DomainSession<QuotaDependentDomainRequest>,
    trx: Transaction<DomainStateRecord>,
    attemptTime: number = Date.now() / 1000 // Convert current time in ms to seconds.
  ): Promise<OdisQuotaStatusResult<QuotaDependentDomainRequest>> {
    const { domain } = session.request.body
    if (isSequentialDelayDomain(domain)) {
      const result = checkSequentialDelayRateLimit(
        domain,
        attemptTime,
        state.toSequentialDelayDomainState(attemptTime)
      )
      if (result.accepted) {
        const newState = new DomainStateRecord(domain, result.state)
        // Persist the updated domain quota to the database.
        // This will trigger an insert if its the first update to the domain instance.
        await updateDomainStateRecord(domain, newState, trx, session.logger)
        return { sufficient: true, state: newState }
      }
      // If the result was rejected, the domainStateRecord does not change
      return { sufficient: false, state }
    } else {
      throw new Error(ErrorMessage.UNSUPPORTED_DOMAIN)
    }
  }

  public async getQuotaStatus(
    session: DomainSession<QuotaDependentDomainRequest>,
    trx?: Transaction<DomainStateRecord>
  ): Promise<DomainStateRecord> {
    return getDomainStateRecordOrEmpty(session.request.body.domain, session.logger, trx)
  }
}
