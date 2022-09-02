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
    session: PnpSession<SignMessageRequest>, // TODO(Alec): pass in failingOpen var to skip logging / metrics?
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
      await this.updateQuotaStatus(session, trx)
      state.performedQueryCount++
    }
    return { sufficient, state }
  }

  public async getQuotaStatus(
    // TODO(Alec)
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>,
    trx?: Knex.Transaction
  ): Promise<PnpQuotaStatus> {
    // tslint:disable-next-line: no-console
    console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&')
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
      totalQuota: -1,
      performedQueryCount: -1,
      blockNumber: undefined,
    }
    if (performedQueryCountResult.status === 'fulfilled') {
      quotaStatus.performedQueryCount = performedQueryCountResult.value
    } else {
      session.logger.error(
        { error: performedQueryCountResult.reason },
        'failed to get performedQueryCount from db'
      )
      session.errors.push(ErrorMessage.DATABASE_GET_FAILURE) // TODO(Alec): should we push a more specific error?
    }
    let hadBlockchainError = false
    if (totalQuotaResult.status === 'fulfilled') {
      quotaStatus.totalQuota = totalQuotaResult.value
    } else {
      session.logger.error(
        { error: totalQuotaResult.reason },
        'failed to get totalQuota from full node'
      )
      hadBlockchainError = true
    }
    if (blockNumberResult.status === 'fulfilled') {
      quotaStatus.blockNumber = blockNumberResult.value
    } else {
      session.logger.error(
        { error: blockNumberResult.reason },
        'failed to get blockNumber from full node'
      )
      hadBlockchainError = true
    }
    if (hadBlockchainError) {
      session.errors.push(ErrorMessage.CONTRACT_GET_FAILURE)
    }

    return quotaStatus
  }

  protected async updateQuotaStatus(
    session: PnpSession<SignMessageRequest>,
    trx: Knex.Transaction
  ): Promise<void> {
    // TODO(2.0.0, refactor) Review db error handling (https://github.com/celo-org/celo-monorepo/issues/9795)
    try {
      await Promise.all([
        storeRequest(this.db, session.request.body, session.logger, trx),
        incrementQueryCount(this.db, session.request.body.account, session.logger, trx),
      ])
    } catch (error) {
      session.logger.error({ error }, 'failed to update quota status') // TODO(Alec): check logging one level up
      session.errors.push(ErrorMessage.FAILURE_TO_UPDATE_QUOTA_STATUS)
      throw error
    }
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
