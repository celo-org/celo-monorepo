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
import { Counters, Histograms, meter } from '../../common/metrics'
import { OdisQuotaStatusResult, QuotaService } from '../../common/quota'
import { getBlockNumber } from '../../common/web3/contracts'
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
      session.logger.warn({ ...state }, 'No remaining quota')
      if (this.bypassQuotaForE2ETesting(session.request.body)) {
        Counters.testQuotaBypassedRequests.inc()
        session.logger.info(session.request.body, 'Request will bypass quota check for e2e testing')
        sufficient = true
      }
    } else {
      await Promise.all([
        storeRequest(this.db, session.request.body, session.logger, trx),
        incrementQueryCount(this.db, session.request.body.account, session.logger, trx),
      ])
      state.performedQueryCount++
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
