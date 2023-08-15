import {
  checkSequentialDelayRateLimit,
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  isSequentialDelayDomain,
  SequentialDelayDomain,
} from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import {
  DomainStateRecord,
  toDomainStateRecord,
  toSequentialDelayDomainState,
} from '../../common/database/models/domain-state'
import {
  getDomainStateRecordOrEmpty,
  updateDomainStateRecord,
} from '../../common/database/wrappers/domain-state'
import { OdisQuotaStatusResult } from '../../common/quota'
import { DomainSession } from '../session'
import Logger from 'bunyan'

declare type QuotaDependentDomainRequest =
  | DomainQuotaStatusRequest
  | DomainRestrictedSignatureRequest

export class DomainQuotaService {
  constructor(readonly db: Knex) {}

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
        await updateDomainStateRecord(this.db, domain, newState, trx, session.logger)
        return { sufficient: true, state: newState }
      }
      // If the result was rejected, the domainStateRecord does not change
      return { sufficient: false, state }
    } else {
      throw new Error(ErrorMessage.UNSUPPORTED_DOMAIN)
    }
  }

  async getQuotaStatus(
    domain: SequentialDelayDomain,
    logger: Logger,
    trx?: Knex.Transaction<DomainStateRecord>
  ): Promise<DomainStateRecord> {
    return getDomainStateRecordOrEmpty(this.db, domain, logger, trx)
  }
}
