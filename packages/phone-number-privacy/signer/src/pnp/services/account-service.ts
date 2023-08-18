import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  FULL_NODE_TIMEOUT_IN_MS,
  getDataEncryptionKey,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
} from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import Logger from 'bunyan'
import { LRUCache } from 'lru-cache'
import { OdisError, wrapError } from '../../common/error'
import { Counters } from '../../common/metrics'
import { traceAsyncFunction } from '../../common/tracing-utils'
import { getOnChainOdisPayments } from '../../common/web3/contracts'
import { config } from '../../config'

export interface PnpAccount {
  dek: string // onChain
  address: string // onChain
  pnpTotalQuota: number // onChain
}

export interface AccountService {
  getAccount(address: string): Promise<PnpAccount>
}

interface CachedValue {
  dek: string
  pnpTotalQuota: number
}
export interface ContractKitAccountServiceOptions {
  fullNodeTimeoutMs: number
  fullNodeRetryCount: number
  fullNodeRetryDelayMs: number
}

export class CachingAccountService implements AccountService {
  private cache: LRUCache<string, CachedValue, any>
  constructor(baseService: AccountService) {
    this.cache = new LRUCache({
      max: 500,
      ttl: 5 * 1000, // 5 seconds
      allowStale: true,
      fetchMethod: async (address: string) => {
        const account = await baseService.getAccount(address)
        return { dek: account.dek, pnpTotalQuota: account.pnpTotalQuota }
      },
    })
  }

  getAccount(address: string): Promise<PnpAccount> {
    return traceAsyncFunction('CachingAccountService - getAccount', async () => {
      const value = await this.cache.fetch(address)

      if (value === undefined) {
        // TODO decide which error ot use here
        throw new OdisError(ErrorMessage.FAILURE_TO_GET_DEK)
      }
      return {
        address,
        dek: value.dek,
        pnpTotalQuota: value.pnpTotalQuota,
      }
    })
  }
}

// tslint:disable-next-line:max-classes-per-file
export class ContractKitAccountService implements AccountService {
  constructor(
    private readonly logger: Logger,
    private readonly kit: ContractKit,
    private readonly opts: ContractKitAccountServiceOptions = {
      fullNodeTimeoutMs: FULL_NODE_TIMEOUT_IN_MS,
      fullNodeRetryCount: RETRY_COUNT,
      fullNodeRetryDelayMs: RETRY_DELAY_IN_MS,
    }
  ) {}

  async getAccount(address: string): Promise<PnpAccount> {
    return traceAsyncFunction('ContractKitAccountService - getAccount', async () => {
      const dek = await wrapError(
        getDataEncryptionKey(
          address,
          this.kit,
          this.logger,
          this.opts.fullNodeTimeoutMs,
          this.opts.fullNodeRetryCount,
          this.opts.fullNodeRetryDelayMs
        ).catch((err) => {
          // TODO could clean this up...quick fix since we weren't incrementing blockchain error counter
          this.logger.error({ err, address }, 'failed to get on-chain odis balance for account')
          Counters.blockchainErrors.inc()
          throw err
        }),
        ErrorMessage.FAILURE_TO_GET_DEK
      )

      const { queryPriceInCUSD } = config.quota
      const totalPaidInWei = await wrapError(
        getOnChainOdisPayments(this.kit, this.logger, address, 'FAKE_URL'),
        ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA
      )
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
    })
  }
}
