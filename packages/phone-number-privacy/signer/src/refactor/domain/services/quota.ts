import {
  checkSequentialDelayRateLimit,
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  isSequentialDelayDomain,
} from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import {
  DomainStateRecord,
  toDomainStateRecord,
  toSequentialDelayDomainState,
} from '../../../database/models/domainState'
import {
  getDomainStateRecordOrEmpty,
  updateDomainStateRecord,
} from '../../../database/wrappers/domainState'
import { OdisQuotaStatusResult, QuotaService } from '../../base/quota'
import { DomainSession } from '../session'

declare type QuotaDependentDomainRequest =
  | DomainQuotaStatusRequest
  | DomainRestrictedSignatureRequest

export class DomainQuotaService implements QuotaService<QuotaDependentDomainRequest> {
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
        toSequentialDelayDomainState(state, attemptTime)
      )
      if (result.accepted) {
        const newState = toDomainStateRecord(domain, result.state)
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
