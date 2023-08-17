import { ContractKit } from '@celo/contractkit'
import {
  FULL_NODE_TIMEOUT_IN_MS,
  getDataEncryptionKey,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
} from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import { insertRequest } from '../../common/database/wrappers/request'
import { Histograms, newMeter } from '../../common/metrics'
import { getOnChainOdisPayments } from '../../common/web3/contracts'
import { config } from '../../config'
import { Context } from '../context'

export interface PnpAccount {
  dek: string // onChain
  address: string // onChain
  pnpTotalQuota: number // onChain
}

export interface AccountService {
  getDekForAccount(address: string, ctx: Context): Promise<string>
  getAccount(address: string, ctx: Context): Promise<PnpAccount>
}

// interface ContratKitAccountService extends AccountService {}

// // this one use another AccountService to fill the cache (contractKit one)
// interface CachingAccountService extends AccountService {}

export interface ContractKitAccountServiceOptions {
  fullNodeTimeoutMs: number
  fullNodeRetryCount: number
  fullNodeRetryDelayMs: number
}

export class ContractKitAccountService implements AccountService {
  constructor(
    private readonly kit: ContractKit,
    private readonly opts: ContractKitAccountServiceOptions = {
      fullNodeTimeoutMs: FULL_NODE_TIMEOUT_IN_MS,
      fullNodeRetryCount: RETRY_COUNT,
      fullNodeRetryDelayMs: RETRY_DELAY_IN_MS,
    }
  ) {}

  getDekForAccount(address: string, ctx: Context): Promise<string> {
    return this.getAccount(address, ctx).then((acc) => acc.dek)
  }

  async getAccount(address: string, ctx: Context): Promise<PnpAccount> {
    const logger = ctx.logger
    const url = ctx.url

    const dek = await getDataEncryptionKey(
      address,
      this.kit,
      logger,
      this.opts.fullNodeTimeoutMs,
      this.opts.fullNodeRetryCount,
      this.opts.fullNodeRetryDelayMs
    )

    const { queryPriceInCUSD } = config.quota
    const totalPaidInWei = await getOnChainOdisPayments(this.kit, logger, address, url)
    const totalQuotaBN = totalPaidInWei
      .div(queryPriceInCUSD.times(new BigNumber(1e18)))
      .integerValue(BigNumber.ROUND_DOWN)

    // If any account hits an overflow here, we need to redesign how
    // quota/queries are computed anyways.
    const pnpTotalQuota = totalQuotaBN.toNumber()

    return {
      address,
      dek,
      pnpTotalQuota,
    }
  }
}

export interface PnpRequestService {
  getUsedQuotaForAccount(address: string, ctx: Context): Promise<number>
  recordRequest(address: string, blindedQuery: string, ctx: Context): Promise<void>
}

/**
 * PnpQuotaService is responsible for serving information about pnp quota
 *
 */
// tslint:disable-next-line
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
