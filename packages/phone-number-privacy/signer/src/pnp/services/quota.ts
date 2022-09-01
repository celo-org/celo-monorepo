import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  PnpQuotaRequest,
  PnpQuotaStatus,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import { storeRequest } from '../../common/database/wrappers/request'
import { Counters, Histograms } from '../../common/metrics'
import { OdisQuotaStatusResult, QuotaService } from '../../common/quota'
import { getBlockNumber, meter } from '../../common/web3/contracts'
import { config } from '../../config'
import { PnpSession } from '../session'

export abstract class PnpQuotaService
  implements QuotaService<SignMessageRequest | PnpQuotaRequest> {
  constructor(readonly db: Knex, readonly kit: ContractKit) {}

  public async checkAndUpdateQuotaStatus(
    state: PnpQuotaStatus,
    session: PnpSession<SignMessageRequest>,
    trx: Knex.Transaction
  ): Promise<OdisQuotaStatusResult<SignMessageRequest>> {
    const remainingQuota = state.totalQuota - state.performedQueryCount
    Histograms.userRemainingQuotaAtRequest.labels(session.request.url).observe(remainingQuota)
    let sufficient = remainingQuota > 0
    if (!sufficient) {
      session.logger.debug({ ...state }, 'No remaining quota')
      if (this.bypassQuotaForE2ETesting(session.request.body)) {
        Counters.testQuotaBypassedRequests.inc()
        session.logger.info(
          { request: session.request.body },
          'Request will bypass quota check for e2e testing'
        )
        sufficient = true
      }
    } else {
      if (await this.updateQuotaStatus(session, trx)) {
        state.performedQueryCount++
      }
    }
    return { sufficient, state }
  }

  public async getQuotaStatus(
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>,
    trx?: Knex.Transaction
  ): Promise<PnpQuotaStatus> {
    const { account } = session.request.body
    const [performedQueryCountResult, totalQuotaResult, blockNumberResult] = await meter(
      (_session: PnpSession<SignMessageRequest | PnpQuotaRequest>) =>
        Promise.allSettled([
          getPerformedQueryCount(this.db, account, session.logger, trx),
          this.getTotalQuota(_session),
          getBlockNumber(this.kit),
        ]),
      [session],
      (err: any) => {
        throw err
      },
      Histograms.getRemainingQueryCountInstrumentation,
      ['getQuotaStatus', session.request.url]
    )

    // TODO EN: revisit this logic
    // OLD NOTE EN: this should never actually reject since the error is caught??
    const quotaStatus: PnpQuotaStatus = {
      totalQuota: -1, // TODO(2.0.0) consider making this undefined (https://github.com/celo-org/celo-monorepo/issues/9804)
      performedQueryCount: -1,
      blockNumber: undefined,
    }
    if (performedQueryCountResult.status === 'fulfilled') {
      quotaStatus.performedQueryCount = performedQueryCountResult.value
    } else {
      session.logger.error(
        { err: performedQueryCountResult.reason },
        ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
      )
      session.errors.push(
        ErrorMessage.DATABASE_GET_FAILURE,
        ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
      )
    }
    let hadFullNodeError = false
    if (totalQuotaResult.status === 'fulfilled') {
      quotaStatus.totalQuota = totalQuotaResult.value
    } else {
      session.logger.error(
        { err: totalQuotaResult.reason },
        ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA
      )
      hadFullNodeError = true
      session.errors.push(ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA)
    }
    if (blockNumberResult.status === 'fulfilled') {
      quotaStatus.blockNumber = blockNumberResult.value
    } else {
      session.logger.error(
        { err: blockNumberResult.reason },
        ErrorMessage.FAILURE_TO_GET_BLOCK_NUMBER
      )
      hadFullNodeError = true
      session.errors.push(ErrorMessage.FAILURE_TO_GET_BLOCK_NUMBER)
    }
    if (hadFullNodeError) {
      session.errors.push(ErrorMessage.FULL_NODE_ERROR)
    }

    return quotaStatus
  }

  protected async updateQuotaStatus(
    session: PnpSession<SignMessageRequest>,
    trx: Knex.Transaction
  ): Promise<boolean> {
    // TODO(2.0.0, refactor) Review db error handling (https://github.com/celo-org/celo-monorepo/issues/9795)
    const [storeRequestResult, incrementQueryCountResult] = await Promise.allSettled([
      storeRequest(this.db, session.request.body, session.logger, trx),
      incrementQueryCount(this.db, session.request.body.account, session.logger, trx),
    ])
    if (storeRequestResult.status === 'rejected') {
      session.logger.error(
        { error: storeRequestResult.reason },
        ErrorMessage.FAILURE_TO_STORE_REQUEST
      )
      session.errors.push(ErrorMessage.FAILURE_TO_STORE_REQUEST)
      // We don't rollback here bc the user should still be charged quota for the signature
      // even if the request wasn't stored
    }
    if (incrementQueryCountResult.status === 'rejected') {
      session.logger.error(
        { error: incrementQueryCountResult.reason },
        ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT
      )
      session.errors.push(
        ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT,
        ErrorMessage.FAILURE_TO_STORE_REQUEST
      )
      // We rollback storing the request (which would allow for replays) if we can't charge the user quota.
      // Note that the error is still caught here, which means we will provide the signature ('fail open')
      // despite not charging the user quota.
      await trx.rollback()
      return false
    }
    return true
  }

  protected async getTotalQuota(
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number> {
    return meter(
      this.getTotalQuotaWithoutMeter.bind(this),
      [session],
      (err: any) => {
        throw err
      },
      Histograms.getRemainingQueryCountInstrumentation,
      ['getTotalQuota', session.request.url]
    )
  }

  /*
   * Calculates how many queries the caller has unlocked;
   * must be implemented by subclasses.
   */
  protected abstract getTotalQuotaWithoutMeter(
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number>

  private bypassQuotaForE2ETesting(requestBody: SignMessageRequest): boolean {
    const sessionID = Number(requestBody.sessionID)
    return !Number.isNaN(sessionID) && sessionID % 100 < config.test_quota_bypass_percentage
  }
}
