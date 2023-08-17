import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  FULL_NODE_TIMEOUT_IN_MS,
  getDataEncryptionKey,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
} from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { wrapError } from '../../common/error'
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

    const dek = await wrapError(
      getDataEncryptionKey(
        address,
        this.kit,
        logger,
        this.opts.fullNodeTimeoutMs,
        this.opts.fullNodeRetryCount,
        this.opts.fullNodeRetryDelayMs
      ),
      ErrorMessage.FAILURE_TO_GET_DEK
    )

    const { queryPriceInCUSD } = config.quota
    const totalPaidInWei = await wrapError(
      getOnChainOdisPayments(this.kit, logger, address, url),
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
  }
}
