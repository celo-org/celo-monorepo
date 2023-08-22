import { ErrorMessage } from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { Context } from '../../common/context'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import { getRequestExists, insertRequest } from '../../common/database/wrappers/request'
import { wrapError } from '../../common/error'
import { Histograms, newMeter } from '../../common/metrics'
import { traceAsyncFunction } from '../../common/tracing-utils'

export interface PnpRequestService {
  recordRequest(address: string, blindedQuery: string, ctx: Context): Promise<void>
  getUsedQuotaForAccount(address: string, ctx: Context): Promise<number>
  isDuplicateRequest(address: string, blindedQuery: string, ctx: Context): Promise<boolean>
}

export class DefaultPnpRequestService implements PnpRequestService {
  constructor(readonly db: Knex) {}

  public async recordRequest(
    account: string,
    blindedQueryPhoneNumber: string,
    ctx: Context
  ): Promise<void> {
    return traceAsyncFunction('DefaultPnpRequestService - recordRequest', async () => {
      await Promise.all([
        insertRequest(this.db, account, blindedQueryPhoneNumber, ctx.logger),
        incrementQueryCount(this.db, account, ctx.logger),
      ])
    })
  }

  public async getUsedQuotaForAccount(account: string, ctx: Context): Promise<number> {
    const meter = newMeter(
      Histograms.getRemainingQueryCountInstrumentation,
      'getQuotaStatus',
      ctx.url
    )
    return traceAsyncFunction('DefaultPnpRequestService - getUsedQuotaForAccount', () =>
      meter(() =>
        wrapError(
          getPerformedQueryCount(this.db, account, ctx.logger),
          ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
        )
      )
    )
  }

  public async isDuplicateRequest(
    account: string,
    blindedQueryPhoneNumber: string,
    ctx: Context
  ): Promise<boolean> {
    try {
      return getRequestExists(this.db, account, blindedQueryPhoneNumber, ctx.logger)
    } catch (err) {
      ctx.logger.error(err, 'Failed to check if request already exists in db')
      return false
    }
  }
}

// tslint:disable-next-line:max-classes-per-file
export class MockPnpRequestService implements PnpRequestService {
  public async recordRequest(
    account: string,
    blindedQueryPhoneNumber: string,
    ctx: Context
  ): Promise<void> {
    ctx.logger.info({ account, blindedQueryPhoneNumber }, 'MockPnpRequestService - recordRequest')
    return
  }

  public async getUsedQuotaForAccount(account: string, ctx: Context): Promise<number> {
    ctx.logger.info({ account }, 'MockPnpRequestService - getUsedQuotaForAccount')
    return 0
  }

  public async isDuplicateRequest(
    account: string,
    blindedQueryPhoneNumber: string,
    ctx: Context
  ): Promise<boolean> {
    ctx.logger.info(
      { account, blindedQueryPhoneNumber },
      'MockPnpRequestService - isDuplicateRequest'
    )
    return false
  }
}
