import { ContractKit } from '@celo/contractkit'
import { ErrorMessage, PnpQuotaStatus, SignMessageRequest } from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import { ACCOUNTS_TABLE } from '../../common/database/models/account'
import { REQUESTS_TABLE } from '../../common/database/models/request'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import { storeRequest } from '../../common/database/wrappers/request'
import { Counters, Histograms, newMeter } from '../../common/metrics'
import { OdisQuotaStatusResult } from '../../common/quota'
import { getBlockNumber, getOnChainOdisPayments } from '../../common/web3/contracts'
import { config } from '../../config'
import { Context } from '../context'

/**
 * PnpQuotaService is responsible for serving information about pnp quota
 *
 */
export class PnpQuotaService {
  protected readonly requestsTable: REQUESTS_TABLE = REQUESTS_TABLE.ONCHAIN
  protected readonly accountsTable: ACCOUNTS_TABLE = ACCOUNTS_TABLE.ONCHAIN

  constructor(readonly db: Knex, readonly kit: ContractKit) {}

  public async checkAndUpdateQuotaStatus(
    state: PnpQuotaStatus,
    ctx: Context,
    body: SignMessageRequest,
    trx?: Knex.Transaction
  ): Promise<OdisQuotaStatusResult<SignMessageRequest>> {
    const remainingQuota = state.totalQuota - state.performedQueryCount

    Histograms.userRemainingQuotaAtRequest.labels(ctx.url).observe(remainingQuota)

    let sufficient = remainingQuota > 0
    if (!sufficient) {
      ctx.logger.warn({ ...state }, 'No remaining quota')
      if (this.bypassQuotaForE2ETesting(body)) {
        Counters.testQuotaBypassedRequests.inc()
        ctx.logger.info(body, 'Request will bypass quota check for e2e testing')
        sufficient = true
      }
    } else {
      await Promise.all([
        storeRequest(
          this.db,
          this.requestsTable,
          body.account,
          body.blindedQueryPhoneNumber,
          ctx.logger,
          trx
        ),
        incrementQueryCount(this.db, this.accountsTable, body.account, ctx.logger, trx),
      ])
      state.performedQueryCount++
    }
    return { sufficient, state }
  }

  public async getQuotaStatus(
    account: string,
    ctx: Context,
    trx?: Knex.Transaction
  ): Promise<PnpQuotaStatus> {
    const meter = newMeter(
      Histograms.getRemainingQueryCountInstrumentation,
      'getQuotaStatus',
      ctx.url
    )

    const [performedQueryCountResult, totalQuotaResult, blockNumberResult] = await meter(() =>
      Promise.allSettled([
        getPerformedQueryCount(this.db, this.accountsTable, account, ctx.logger, trx),
        this.getTotalQuota(account, ctx),
        getBlockNumber(this.kit),
      ])
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
      ctx.logger.error(
        { err: performedQueryCountResult.reason },
        ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
      )
      ctx.errors.push(
        ErrorMessage.DATABASE_GET_FAILURE,
        ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
      )
    }

    let hadFullNodeError = false
    if (totalQuotaResult.status === 'fulfilled') {
      quotaStatus.totalQuota = totalQuotaResult.value
    } else {
      ctx.logger.error({ err: totalQuotaResult.reason }, ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA)
      hadFullNodeError = true
      ctx.errors.push(ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA)
    }
    if (blockNumberResult.status === 'fulfilled') {
      quotaStatus.blockNumber = blockNumberResult.value
    } else {
      ctx.logger.error({ err: blockNumberResult.reason }, ErrorMessage.FAILURE_TO_GET_BLOCK_NUMBER)
      hadFullNodeError = true
      ctx.errors.push(ErrorMessage.FAILURE_TO_GET_BLOCK_NUMBER)
    }
    if (hadFullNodeError) {
      ctx.errors.push(ErrorMessage.FULL_NODE_ERROR)
    }

    return quotaStatus
  }

  private async getTotalQuota(account: string, ctx: Context): Promise<number> {
    const meter = newMeter(
      Histograms.getRemainingQueryCountInstrumentation,
      'getTotalQuota',
      ctx.url
    )
    return meter(() => this.getTotalQuotaWithoutMeter(account, ctx))
  }

  /*
   * Calculates how many queries the caller has unlocked;
   * must be implemented by subclasses.
   */
  private async getTotalQuotaWithoutMeter(
    account: string,
    ctx: Context
    // session: PnpSession<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number> {
    const { queryPriceInCUSD } = config.quota
    const totalPaidInWei = await getOnChainOdisPayments(this.kit, ctx.logger, account, ctx.url)
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
