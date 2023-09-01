import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  FULL_NODE_TIMEOUT_IN_MS,
  getDataEncryptionKey,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { LRUCache } from 'lru-cache'
import { OdisError, wrapError } from '../../common/error'
import { traceAsyncFunction } from '../../common/tracing-utils'

export interface AccountService {
  getAccount(address: string): Promise<string>
}

export interface ContractKitAccountServiceOptions {
  fullNodeTimeoutMs: number
  fullNodeRetryCount: number
  fullNodeRetryDelayMs: number
}

export class CachingAccountService implements AccountService {
  private cache: LRUCache<string, string, any>
  constructor(baseService: AccountService) {
    this.cache = new LRUCache({
      max: 500,
      ttl: 5 * 1000, // 5 seconds
      allowStale: true,
      fetchMethod: async (address: string) => {
        return await baseService.getAccount(address)
      },
    })
  }

  getAccount = (address: string): Promise<string> => {
    return traceAsyncFunction('CachingAccountService - getAccount', async () => {
      const dek = await this.cache.fetch(address)

      if (dek === undefined) {
        // TODO decide which error ot use here
        throw new OdisError(ErrorMessage.FAILURE_TO_GET_DEK)
      }
      return dek
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

  async getAccount(address: string): Promise<string> {
    return traceAsyncFunction('ContractKitAccountService - getAccount', async () => {
      return wrapError(
        getDataEncryptionKey(
          address,
          this.kit,
          this.logger,
          this.opts.fullNodeTimeoutMs,
          this.opts.fullNodeRetryCount,
          this.opts.fullNodeRetryDelayMs
        ).catch((err) => {
          // TODO could clean this up...quick fix since we weren't incrementing blockchain error counter
          this.logger.error({ err, address }, 'failed to get on-chain dek for account')
          throw err
        }),
        ErrorMessage.FAILURE_TO_GET_DEK
      )
    })
  }
}

// tslint:disable-next-line:max-classes-per-file
export class MockAccountService implements AccountService {
  constructor(private readonly mockDek: string) {}

  async getAccount(_address: string): Promise<string> {
    return this.mockDek
  }
}
