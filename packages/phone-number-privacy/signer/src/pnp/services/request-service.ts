import { ErrorMessage } from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { Context } from '../../common/context'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import { insertRequest } from '../../common/database/wrappers/request'
import { wrapError } from '../../common/error'
import { Histograms, newMeter } from '../../common/metrics'
import { traceAsyncFunction } from '../../common/tracing-utils'

export interface PnpRequestService {
  getUsedQuotaForAccount(address: string, ctx: Context): Promise<number>
  recordRequest(address: string, blindedQuery: string, ctx: Context): Promise<void>
}

/**
 * PnpQuotaService is responsible for serving information about pnp quota
 *
 */
export class DefaultPnpQuotaService {
  constructor(readonly db: Knex) {}

  public async recordRequest(
    account: string,
    blindedQueryPhoneNumber: string,
    ctx: Context
  ): Promise<void> {
    return traceAsyncFunction('pnpQuotaService - recordRequest', async () => {
      await Promise.all([
        insertRequest(this.db, account, blindedQueryPhoneNumber, ctx.logger),
        incrementQueryCount(this.db, account, ctx.logger),
      ])
    })
  }

  public getUsedQuotaForAccount(account: string, ctx: Context): Promise<number> {
    const meter = newMeter(
      Histograms.getRemainingQueryCountInstrumentation,
      'getQuotaStatus',
      ctx.url
    )

    return traceAsyncFunction('pnpQuotaService - getUsedQuotaForAccount', () =>
      meter(() =>
        wrapError(
          getPerformedQueryCount(this.db, account, ctx.logger),
          ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
        )
      )
    )
  }
}
