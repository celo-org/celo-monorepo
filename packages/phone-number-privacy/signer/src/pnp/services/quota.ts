import { ContractKit } from '@celo/contractkit'
import { ErrorMessage, PnpQuotaStatus, SignMessageRequest } from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import { insertRequest } from '../../common/database/wrappers/request'
import { wrapError } from '../../common/error'
import { Histograms, newMeter } from '../../common/metrics'
import { getOnChainOdisPayments } from '../../common/web3/contracts'
import { config } from '../../config'
import { Context } from '../context'

export interface PnpQuotaService {
  updateQuotaStatus(
    state: PnpQuotaStatus,
    ctx: Context,
    body: SignMessageRequest
  ): Promise<PnpQuotaStatus>

  getQuotaStatus(account: string, ctx: Context): Promise<PnpQuotaStatus>
}

/**
 * PnpQuotaService is responsible for serving information about pnp quota
 *
 */
export class DefaultPnpQuotaService {
  constructor(readonly db: Knex, readonly kit: ContractKit) {}

  public async updateQuotaStatus(
    state: PnpQuotaStatus,
    ctx: Context,
    body: SignMessageRequest
  ): Promise<PnpQuotaStatus> {
    await this.db.transaction((trx) =>
      Promise.all([
        insertRequest(this.db, body.account, body.blindedQueryPhoneNumber, ctx.logger, trx),
        incrementQueryCount(this.db, body.account, ctx.logger, trx),
      ])
    )
    state.performedQueryCount++
    return state
  }

  public getQuotaStatus(account: string, ctx: Context): Promise<PnpQuotaStatus> {
    const meter = newMeter(
      Histograms.getRemainingQueryCountInstrumentation,
      'getQuotaStatus',
      ctx.url
    )
    return meter(async () => {
      const [performedQueryCount, totalQuota] = await wrapError(
        Promise.all([
          getPerformedQueryCount(this.db, account, ctx.logger),
          this.getTotalQuota(account, ctx),
        ]),
        ErrorMessage.FAILURE_TO_GET_ACCOUNT
      )
      return { totalQuota, performedQueryCount }
    })
  }

  private async getTotalQuota(account: string, ctx: Context): Promise<number> {
    const meter = newMeter(
      Histograms.getRemainingQueryCountInstrumentation,
      'getTotalQuota',
      ctx.url
    )
    return meter(async () => {
      const { queryPriceInCUSD } = config.quota
      const totalPaidInWei = await getOnChainOdisPayments(this.kit, ctx.logger, account, ctx.url)
      const totalQuota = totalPaidInWei
        .div(queryPriceInCUSD.times(new BigNumber(1e18)))
        .integerValue(BigNumber.ROUND_DOWN)
      // If any account hits an overflow here, we need to redesign how
      // quota/queries are computed anyways.
      return totalQuota.toNumber()
    })
  }
}
