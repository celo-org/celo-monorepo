import { Knex } from 'knex'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import { insertRequest } from '../../common/database/wrappers/request'
import { Histograms, newMeter } from '../../common/metrics'
import { Context } from '../context'

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
    return this.db.transaction(async (trx) => {
      await insertRequest(this.db, account, blindedQueryPhoneNumber, ctx.logger, trx)
      await incrementQueryCount(this.db, account, ctx.logger, trx)
    })
  }

  public getUsedQuotaForAccount(account: string, ctx: Context): Promise<number> {
    const meter = newMeter(
      Histograms.getRemainingQueryCountInstrumentation,
      'getQuotaStatus',
      ctx.url
    )
    return meter(async () => getPerformedQueryCount(this.db, account, ctx.logger))
  }
}
