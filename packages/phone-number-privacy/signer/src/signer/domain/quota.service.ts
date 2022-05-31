import {
  checkSequentialDelayRateLimit,
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  isSequentialDelayDomain,
} from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
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
  async checkAndUpdateQuotaStatus(
    state: DomainStateRecord,
    session: DomainSession<QuotaDependentDomainRequest>,
    trx: Knex.Transaction<DomainStateRecord>,
    attemptTime?: number
  ): Promise<OdisQuotaStatusResult<QuotaDependentDomainRequest>> {
    const { domain } = session.request.body
    // Timestamp precision is lowered to seconds to reduce the chance of effective timing attacks.
    attemptTime = attemptTime ?? Math.floor(Date.now() / 1000)
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

  async getQuotaStatus(
    session: DomainSession<QuotaDependentDomainRequest>,
    trx?: Knex.Transaction<DomainStateRecord>
  ): Promise<DomainStateRecord> {
    return getDomainStateRecordOrEmpty(session.request.body.domain, session.logger, trx)
  }
}
