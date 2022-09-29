import { NULL_ADDRESS } from '@celo/base'
import { StableToken } from '@celo/contractkit'
import {
  ErrorMessage,
  isVerified,
  LegacyPnpQuotaRequest,
  LegacySignMessageRequest,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { ACCOUNTS_TABLE_LEGACY } from '../../common/database/models/account'
import { REQUESTS_TABLE_LEGACY } from '../../common/database/models/request'
import { Counters, Histograms, meter } from '../../common/metrics'
import { QuotaService } from '../../common/quota'
import {
  getCeloBalance,
  getStableTokenBalance,
  getTransactionCount,
  getWalletAddress,
} from '../../common/web3/contracts'
import { config } from '../../config'
import { PnpSession } from '../session'
import { PnpQuotaService } from './quota'

export class LegacyPnpQuotaService
  extends PnpQuotaService
  implements QuotaService<LegacySignMessageRequest | LegacyPnpQuotaRequest> {
  protected readonly requestsTable = REQUESTS_TABLE_LEGACY
  protected readonly accountsTable = ACCOUNTS_TABLE_LEGACY

  protected async getWalletAddressAndIsVerified(
    session: PnpSession<LegacySignMessageRequest | LegacyPnpQuotaRequest>
  ): Promise<{ walletAddress: string; isAccountVerified: boolean }> {
    const { account, hashedPhoneNumber } = session.request.body
    const [walletAddressResult, isVerifiedResult] = await meter(
      (_session: PnpSession<LegacySignMessageRequest | LegacyPnpQuotaRequest>) =>
        Promise.allSettled([
          getWalletAddress(this.kit, session.logger, account, session.request.url),
          hashedPhoneNumber
            ? isVerified(account, hashedPhoneNumber, this.kit, session.logger)
            : Promise.resolve(false),
        ]),
      [session],
      (err: any) => {
        throw err
      },
      Histograms.getRemainingQueryCountInstrumentation,
      ['getWalletAddressAndIsVerified', session.request.url]
    )
    let hadFullNodeError = false,
      isAccountVerified = false,
      walletAddress = NULL_ADDRESS
    if (walletAddressResult.status === 'fulfilled') {
      walletAddress = walletAddressResult.value
    } else {
      session.logger.error(walletAddressResult.reason)
      hadFullNodeError = true
    }
    if (isVerifiedResult.status === 'fulfilled') {
      isAccountVerified = isVerifiedResult.value
    } else {
      session.logger.error(isVerifiedResult.reason)
      hadFullNodeError = true
    }
    if (hadFullNodeError) {
      session.errors.push(ErrorMessage.FULL_NODE_ERROR)
    }

    if (account.toLowerCase() === walletAddress.toLowerCase()) {
      session.logger.debug('walletAddress is the same as accountAddress')
      walletAddress = NULL_ADDRESS // So we don't double count quota
    }

    return { isAccountVerified, walletAddress }
  }

  protected async getBalances(
    session: PnpSession<LegacySignMessageRequest | LegacyPnpQuotaRequest>,
    ...addresses: string[]
  ) {
    const [
      cUSDAccountBalanceResult,
      cEURAccountBalanceResult,
      celoAccountBalanceResult,
    ] = await meter(
      (logger: Logger, ..._addresses: string[]) =>
        Promise.allSettled([
          getStableTokenBalance(
            this.kit,
            StableToken.cUSD,
            logger,
            session.request.url,
            ..._addresses
          ),
          getStableTokenBalance(
            this.kit,
            StableToken.cEUR,
            logger,
            session.request.url,
            ..._addresses
          ),
          getCeloBalance(this.kit, logger, session.request.url, ..._addresses),
        ]),
      [session.logger, ...addresses],
      (err: any) => {
        throw err
      },
      Histograms.getRemainingQueryCountInstrumentation,
      ['getBalances', session.request.url]
    )

    let hadFullNodeError = false
    let cUSDAccountBalance, cEURAccountBalance, celoAccountBalance
    if (cUSDAccountBalanceResult.status === 'fulfilled') {
      cUSDAccountBalance = cUSDAccountBalanceResult.value
    } else {
      session.logger.error(cUSDAccountBalanceResult.reason)
      hadFullNodeError = true
    }
    if (cEURAccountBalanceResult.status === 'fulfilled') {
      cEURAccountBalance = cEURAccountBalanceResult.value
    } else {
      session.logger.error(cEURAccountBalanceResult.reason)
      hadFullNodeError = true
    }
    if (celoAccountBalanceResult.status === 'fulfilled') {
      celoAccountBalance = celoAccountBalanceResult.value
    } else {
      session.logger.error(celoAccountBalanceResult.reason)
      hadFullNodeError = true
    }
    if (hadFullNodeError) {
      session.errors.push(ErrorMessage.FULL_NODE_ERROR)
    }

    return { cUSDAccountBalance, cEURAccountBalance, celoAccountBalance }
  }

  /*
   * Calculates how many queries the caller has unlocked based on the algorithm
   * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
   * If the caller is not verified, they must have a minimum balance to get the unverifiedQueryMax.
   */
  protected async getTotalQuotaWithoutMeter(
    session: PnpSession<LegacySignMessageRequest | LegacyPnpQuotaRequest>
  ): Promise<number> {
    const {
      unverifiedQueryMax,
      additionalVerifiedQueryMax,
      queryPerTransaction,
      minDollarBalance,
      minEuroBalance,
      minCeloBalance,
    } = config.quota

    const { account } = session.request.body

    const { walletAddress, isAccountVerified } = await this.getWalletAddressAndIsVerified(session)

    if (walletAddress !== NULL_ADDRESS) {
      Counters.requestsWithWalletAddress.inc()
    }

    const transactionCount = await getTransactionCount(
      this.kit,
      session.logger,
      session.request.url,
      account,
      walletAddress // TODO(2.0.0, refactor): Make sure we filter out null address in getTransactionCount
    )
    session.logger.debug({ account, transactionCount })

    if (isAccountVerified) {
      Counters.requestsWithVerifiedAccount.inc()
      session.logger.debug({ account }, 'Account is verified')
      return this.calculateQuotaForVerifiedAccount(
        account,
        unverifiedQueryMax,
        additionalVerifiedQueryMax,
        queryPerTransaction,
        transactionCount,
        session.logger
      )
    }

    session.logger.debug({ account }, 'Account is not verified. Checking if min balance is met.')

    const { cUSDAccountBalance, cEURAccountBalance, celoAccountBalance } = await this.getBalances(
      session,
      account,
      walletAddress
    )

    // Min balance can be in either cUSD, cEUR or CELO
    if (
      cUSDAccountBalance?.isGreaterThanOrEqualTo(minDollarBalance) ||
      cEURAccountBalance?.isGreaterThanOrEqualTo(minEuroBalance) ||
      celoAccountBalance?.isGreaterThanOrEqualTo(minCeloBalance)
    ) {
      Counters.requestsWithUnverifiedAccountWithMinBalance.inc()
      session.logger.debug(
        {
          account,
          cUSDAccountBalance,
          cEURAccountBalance,
          celoAccountBalance,
          minDollarBalance,
          minEuroBalance,
          minCeloBalance,
        },
        'Account is not verified but meets min balance'
      )

      return this.calculateQuotaForUnverifiedAccountWithMinBalance(
        account,
        unverifiedQueryMax,
        queryPerTransaction,
        transactionCount,
        session.logger
      )
    }

    session.logger.debug({ account }, 'Account is not verified and does not meet min balance')

    const quota = 0

    session.logger.trace({
      account,
      cUSDAccountBalance,
      cEURAccountBalance,
      celoAccountBalance,
      minDollarBalance,
      minEuroBalance,
      minCeloBalance,
      quota,
    })

    return quota
  }

  private calculateQuotaForVerifiedAccount(
    account: string,
    unverifiedQueryMax: number,
    additionalVerifiedQueryMax: number,
    queryPerTransaction: number,
    transactionCount: number,
    logger: Logger
  ): number {
    const quota =
      unverifiedQueryMax + additionalVerifiedQueryMax + queryPerTransaction * transactionCount

    logger.trace({
      account,
      unverifiedQueryMax,
      additionalVerifiedQueryMax,
      queryPerTransaction,
      transactionCount,
      quota,
    })

    return quota
  }

  private calculateQuotaForUnverifiedAccountWithMinBalance(
    account: string,
    unverifiedQueryMax: number,
    queryPerTransaction: number,
    transactionCount: number,
    logger: Logger
  ): number {
    const quota = unverifiedQueryMax + queryPerTransaction * transactionCount

    logger.trace({
      account,
      unverifiedQueryMax,
      queryPerTransaction,
      transactionCount,
      quota,
    })

    return quota
  }
}
