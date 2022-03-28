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

export class DomainQuotaService
  implements IQuotaService<DomainQuotaStatusRequest | DomainRestrictedSignatureRequest> {
  public async checkAndUpdateQuotaStatus(
    state: DomainStateRecord,
    session: DomainSession<DomainQuotaStatusRequest | DomainRestrictedSignatureRequest>,
    trx: Transaction<DomainStateRecord>
  ): Promise<OdisQuotaStatusResult<DomainQuotaStatusRequest | DomainRestrictedSignatureRequest>> {
    const { domain } = session.request.body
    if (isSequentialDelayDomain(domain)) {
      const result = checkSequentialDelayRateLimit(
        domain,
        Date.now() / 1000, // Divide by 1000 to convert the current time in ms to seconds.
        state.toSequentialDelayDomainState()
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
    session: DomainSession<DomainQuotaStatusRequest | DomainRestrictedSignatureRequest>,
    trx?: Transaction<DomainStateRecord>
  ): Promise<DomainStateRecord> {
    return getDomainStateRecordOrEmpty(session.request.body.domain, session.logger, trx)
  }
}
