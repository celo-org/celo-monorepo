import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  PnpQuotaRequest,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { incrementQueryCount } from '../../../database/wrappers/account'
import { storeRequest } from '../../../database/wrappers/request'
import { OdisQuotaStatusResult, QuotaService } from '../../base/quota'
import { PnpSession } from '../session'
export interface PnpQuotaStatus {
  queryCount: number
  totalQuota: number
  blockNumber: number
}

export class PnpQuotaService implements QuotaService<SignMessageRequest | PnpQuotaRequest> {
  constructor(readonly db: Knex, readonly kit: ContractKit) {}

  public async checkAndUpdateQuotaStatus(
    _state: PnpQuotaStatus,
    _session: PnpSession<SignMessageRequest>,
    _trx: Knex.Transaction
  ): Promise<OdisQuotaStatusResult<SignMessageRequest>> {
    throw new Error('Method not implemented.')
  }

  public async getQuotaStatus(
    _session: PnpSession<SignMessageRequest | PnpQuotaRequest>,
    _trx?: Knex.Transaction
  ): Promise<PnpQuotaStatus> {
    throw new Error('Method not implemented.')
  }

  protected async updateQuotaStatus(
    trx: Knex.Transaction,
    session: PnpSession<SignMessageRequest>
  ) {
    // TODO: Review db error handling
    const [requestStored, queryCountIncremented] = await Promise.all([
      storeRequest(this.db, session.request.body, session.logger, trx),
      incrementQueryCount(this.db, session.request.body.account, session.logger, trx),
    ])
    if (!requestStored) {
      session.logger.debug('Did not store request.')
      session.errors.push(ErrorMessage.FAILURE_TO_STORE_REQUEST)
    }
    if (!queryCountIncremented) {
      session.logger.debug('Did not increment query count.')
      session.errors.push(ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT)
    }
  }
}
