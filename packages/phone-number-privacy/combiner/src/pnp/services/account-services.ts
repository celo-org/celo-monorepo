import { ContractKit } from '@celo/contractkit'
import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { LRUCache } from 'lru-cache'
import { OdisError, wrapError } from '../../common/error'
import { traceAsyncFunction } from '../../common/tracing-utils'
import { getDEK } from '../../common/web3/contracts'

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
        return baseService.getAccount(address)
      },
    })
  }

  getAccount = (address: string): Promise<string> => {
    return traceAsyncFunction('CachingAccountService - getAccount', async () => {
      const dek = await this.cache.fetch(address)

      if (dek === undefined) {
        // TODO decide which error ot use here
        throw new OdisError(ErrorMessage.FULL_NODE_ERROR)
      }
      return dek
    })
  }
}

// tslint:disable-next-line:max-classes-per-file
export class ContractKitAccountService implements AccountService {
  constructor(private readonly logger: Logger, private readonly kit: ContractKit) {}

  async getAccount(address: string): Promise<string> {
    return traceAsyncFunction('ContractKitAccountService - getAccount', async () => {
      return wrapError(getDEK(this.kit, this.logger, address), ErrorMessage.FAILURE_TO_GET_DEK)
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
