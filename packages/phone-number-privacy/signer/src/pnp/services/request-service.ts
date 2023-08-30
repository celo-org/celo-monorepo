import { ErrorMessage } from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { Context } from '../../common/context'
import { PnpSignRequestRecord } from '../../common/database/models/request'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import {
  deleteRequestsOlderThan,
  getRequestIfExists,
  insertRequest,
} from '../../common/database/wrappers/request'
import { wrapError } from '../../common/error'
import { traceAsyncFunction } from '../../common/tracing-utils'

export interface PnpRequestService {
  recordRequest(
    address: string,
    blindedQuery: string,
    signature: string,
    ctx: Context
  ): Promise<void>
  getUsedQuotaForAccount(address: string, ctx: Context): Promise<number>
  getDuplicateRequest(
    address: string,
    blindedQuery: string,
    ctx: Context
  ): Promise<PnpSignRequestRecord | undefined>
  removeOldRequest(daysToKeep: number, ctx: Context): Promise<number>
}

export class DefaultPnpRequestService implements PnpRequestService {
  constructor(readonly db: Knex) {}

  public async recordRequest(
    account: string,
    blindedQueryPhoneNumber: string,
    signature: string,
    ctx: Context
  ): Promise<void> {
    return traceAsyncFunction('DefaultPnpRequestService - recordRequest', async () => {
      return this.db.transaction(async (trx) => {
        await insertRequest(this.db, account, blindedQueryPhoneNumber, signature, ctx.logger, trx)
        await incrementQueryCount(this.db, account, ctx.logger, trx)
      })
    })
  }

  public async getUsedQuotaForAccount(account: string, ctx: Context): Promise<number> {
    return traceAsyncFunction('DefaultPnpRequestService - getUsedQuotaForAccount', () =>
      wrapError(
        getPerformedQueryCount(this.db, account, ctx.logger),
        ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
      )
    )
  }

  public async getDuplicateRequest(
    account: string,
    blindedQueryPhoneNumber: string,
    ctx: Context
  ): Promise<PnpSignRequestRecord | undefined> {
    try {
      const res = await getRequestIfExists(this.db, account, blindedQueryPhoneNumber, ctx.logger)
      return res
    } catch (err) {
      ctx.logger.error(err, 'Failed to check if request already exists in db')
      return undefined
    }
  }

  public async removeOldRequest(daysToKeep: number, ctx: Context): Promise<number> {
    if (daysToKeep < 0) {
      ctx.logger.error('RemoveOldRequest - DaysToKeep should be bigger than or equal to zero')
      return 0
    }
    const since: Date = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
    return traceAsyncFunction('DefaultPnpRequestService - removeOldRequest', () =>
      deleteRequestsOlderThan(this.db, since, ctx.logger)
    )
  }
}

// tslint:disable-next-line:max-classes-per-file
export class MockPnpRequestService implements PnpRequestService {
  public async recordRequest(
    account: string,
    blindedQueryPhoneNumber: string,
    signature: string,
    ctx: Context
  ): Promise<void> {
    ctx.logger.info(
      { account, blindedQueryPhoneNumber, signature },
      'MockPnpRequestService - recordRequest'
    )
    return
  }

  public async getUsedQuotaForAccount(account: string, ctx: Context): Promise<number> {
    ctx.logger.info({ account }, 'MockPnpRequestService - getUsedQuotaForAccount')
    return 0
  }

  public async getDuplicateRequest(
    account: string,
    blindedQueryPhoneNumber: string,
    ctx: Context
  ): Promise<PnpSignRequestRecord | undefined> {
    ctx.logger.info(
      { account, blindedQueryPhoneNumber },
      'MockPnpRequestService - isDuplicateRequest'
    )
    return undefined
  }

  public async removeOldRequest(daysToKeep: number, ctx: Context): Promise<number> {
    ctx.logger.info({ daysToKeep }, 'MockPnpRequestService - removeOldRequest')
    return 0
  }
}
