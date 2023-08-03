import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  PnpQuotaRequest,
  PnpQuotaStatus,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import { ACCOUNTS_TABLE } from '../../common/database/models/account'
import { REQUESTS_TABLE } from '../../common/database/models/request'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import { storeRequest } from '../../common/database/wrappers/request'
import { Counters, Histograms, meter } from '../../common/metrics'
import { OdisQuotaStatusResult, QuotaService } from '../../common/quota'
import { getBlockNumber, getOnChainOdisPayments } from '../../common/web3/contracts'
import { config } from '../../config'
import { PnpSession } from '../session'

export class PnpQuotaService implements QuotaService<SignMessageRequest | PnpQuotaRequest> {
  protected readonly requestsTable: REQUESTS_TABLE = REQUESTS_TABLE.ONCHAIN
  protected readonly accountsTable: ACCOUNTS_TABLE = ACCOUNTS_TABLE.ONCHAIN

  constructor(readonly db: Knex, readonly kit: ContractKit) {}

  public async checkAndUpdateQuotaStatus(
    state: PnpQuotaStatus,
    session: PnpSession<SignMessageRequest>,
    trx?: Knex.Transaction
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
        storeRequest(
          this.db,
          this.requestsTable,
          session.request.body.account,
          session.request.body.blindedQueryPhoneNumber,
          session.logger,
          trx
        ),
        incrementQueryCount(
          this.db,
          this.accountsTable,
          session.request.body.account,
          session.logger,
          trx
        ),
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
          getPerformedQueryCount(this.db, this.accountsTable, account, session.logger, trx),
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
      // TODO(future) consider making totalQuota,performedQueryCount undefined
      totalQuota: -1,
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
  protected async getTotalQuotaWithoutMeter(
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number> {
    const { queryPriceInCUSD } = config.quota
    const { account } = session.request.body
    const totalPaidInWei = await getOnChainOdisPayments(
      this.kit,
      session.logger,
      account,
      session.request.url
    )
    const totalQuota = totalPaidInWei
      .div(queryPriceInCUSD.times(new BigNumber(1e18)))
      .integerValue(BigNumber.ROUND_DOWN)
    // If any account hits an overflow here, we need to redesign how
    // quota/queries are computed anyways.
    return totalQuota.toNumber()
  }

  private bypassQuotaForE2ETesting(requestBody: SignMessageRequest): boolean {
    const sessionID = Number(requestBody.sessionID)
    return !Number.isNaN(sessionID) && sessionID % 100 < config.test_quota_bypass_percentage
  }
}
