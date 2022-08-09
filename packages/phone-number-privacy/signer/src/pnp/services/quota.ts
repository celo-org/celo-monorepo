import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  PnpQuotaRequest,
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
export interface PnpQuotaStatus {
  queryCount: number
  totalQuota: number
  blockNumber: number
}

export abstract class PnpQuotaService
  implements QuotaService<SignMessageRequest | PnpQuotaRequest> {
  constructor(readonly db: Knex, readonly kit: ContractKit) {}

  public async checkAndUpdateQuotaStatus(
    state: PnpQuotaStatus,
    session: PnpSession<SignMessageRequest>,
    trx: Knex.Transaction
  ): Promise<OdisQuotaStatusResult<SignMessageRequest>> {
    const remainingQuota = state.totalQuota - state.queryCount
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
      await this.updateQuotaStatus(trx, session)
      state.queryCount++
    }
    return { sufficient, state }
  }

  public async getQuotaStatus(
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>,
    trx?: Knex.Transaction
  ): Promise<PnpQuotaStatus> {
    const { account } = session.request.body
    const [queryCountResult, totalQuotaResult, blockNumberResult] = await meter(
      (_session: PnpSession<SignMessageRequest | PnpQuotaRequest>) =>
        Promise.allSettled([
          // TODO(Alec)(pnp)
          // Note: The database read of the user's queryCount
          // included here resolves to 0 on error
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

    let hadBlockchainError = false
    let queryCount = -1
    let totalQuota = -1
    let blockNumber = -1
    if (queryCountResult.status === 'fulfilled') {
      queryCount = queryCountResult.value
    } else {
      session.logger.error(queryCountResult.reason)
      session.errors.push(ErrorMessage.DATABASE_GET_FAILURE)
    }
    if (totalQuotaResult.status === 'fulfilled') {
      totalQuota = totalQuotaResult.value
    } else {
      session.logger.error(totalQuotaResult.reason)
      hadBlockchainError = true
    }
    if (blockNumberResult.status === 'fulfilled') {
      blockNumber = blockNumberResult.value
    } else {
      session.logger.error(blockNumberResult.reason)
      hadBlockchainError = true
    }
    if (hadBlockchainError) {
      session.errors.push(ErrorMessage.CONTRACT_GET_FAILURE)
    }

    return { queryCount, totalQuota, blockNumber }
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
