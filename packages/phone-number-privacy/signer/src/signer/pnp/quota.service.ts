import { NULL_ADDRESS } from '@celo/base'
import { StableToken } from '@celo/contractkit'
import {
  ErrorMessage,
  isVerified,
  PnpQuotaRequest,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Counters, Histograms } from '../../common/metrics'
import config from '../../config'
import { getPerformedQueryCount, incrementQueryCount } from '../../database/wrappers/account'
import { storeRequest } from '../../database/wrappers/request'
import {
  getBlockNumber,
  getCeloBalance,
  getContractKit,
  getStableTokenBalance,
  getTransactionCount,
  getWalletAddress,
  meter,
} from '../../web3/contracts'
import { Session } from '../session'

export type PnpQuotaStatus = {
  queryCount?: number
  totalQuota?: number
  blockNumber?: number
}

export interface IPnpQuotaService {
  // checkAndUpdateQuota: (
  //   domain: Domain,
  //   domainState: DomainStateRecord,
  //   trx: Transaction<DomainStateRecord>,
  //   logger: Logger
  // ) => Promise<{ sufficient: boolean; state: DomainStateRecord }>
}

export class DomainQuotaService implements IPnpQuotaService {
  public async checkAndUpdateQuotaStatus(
    queryCount: number,
    totalQuota: number,
    session: Session<SignMessageRequest>
  ): Promise<{ accepted: boolean; newQueryCount: number }> {
    Histograms.userRemainingQuotaAtRequest.observe(totalQuota - queryCount)
    let accepted = true,
      newQueryCount = queryCount
    if (queryCount >= totalQuota) {
      session.logger.debug({ queryCount, totalQuota }, 'No remaining quota')
      if (this.bypassQuotaForE2ETesting(session.request.body)) {
        Counters.testQuotaBypassedRequests.inc()
        session.logger.info(
          { request: session.request.body },
          'Request will bypass quota check for e2e testing'
        )
      } else {
        accepted = false
      }
    } else {
      await this.updateQuotaStatus(session)
      newQueryCount++
    }
    return { accepted, newQueryCount }
  }

  protected async updateQuotaStatus(session: Session<SignMessageRequest>) {
    // TODO(Alec)(Next): use a db transaction here
    const [requestStored, queryCountIncremented] = await Promise.all([
      storeRequest(session.request.body, session.logger),
      incrementQueryCount(session.request.body.account, session.logger),
    ])
    if (!requestStored) {
      session.logger.debug('Did not store request.')
      session.errors.push(ErrorMessage.FAILURE_TO_STORE_REQUEST)
    }
    if (!queryCountIncremented) {
      session.logger.debug('Did not increment query count.')
      session.errors.push(ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT)
    }
  }

  protected async getQuotaStatus(
    session: Session<SignMessageRequest | PnpQuotaRequest>
  ): Promise<PnpQuotaStatus> {
    const { account } = session.request.body
    const [queryCountResult, totalQuotaResult, blockNumberResult] = await meter(
      (_session: Session<SignMessageRequest | PnpQuotaRequest>) =>
        Promise.allSettled([
          // TODO(Alec)
          // Note: The database read of the user's queryCount
          // included here resolves to 0 on error
          getPerformedQueryCount(account, session.logger),
          this.getTotalQuota(session),
          getBlockNumber(),
        ]),
      [session],
      (err: any) => {
        throw err
      },
      Histograms.getRemainingQueryCountInstrumentation,
      'getQuotaStatus'
    )

    let hadBlockchainError = false,
      queryCount,
      totalQuota,
      blockNumber
    if (queryCountResult.status === 'fulfilled') {
      queryCount = queryCountResult.value
    } else {
      session.logger.error(queryCountResult.reason)
      session.errors.push(ErrorMessage.DATABASE_GET_FAILURE)
    }
    if (totalQuotaResult.status === 'fulfilled') {
      totalQuota = totalQuotaResult.value
    } else {
      session.logger.error(totalQuotaResult.reason)
      hadBlockchainError = true
    }
    if (blockNumberResult.status === 'fulfilled') {
      blockNumber = blockNumberResult.value
    } else {
      session.logger.error(blockNumberResult.reason)
      hadBlockchainError = true
    }
    if (hadBlockchainError) {
      session.errors.push(ErrorMessage.CONTRACT_GET_FAILURE)
    }

    return { queryCount, totalQuota, blockNumber }
  }

  protected async getWalletAddressAndIsVerified(
    session: Session<SignMessageRequest | PnpQuotaRequest>
  ): Promise<{ walletAddress: string; isAccountVerified: boolean }> {
    const { account, hashedPhoneNumber } = session.request.body

    const [walletAddressResult, isVerifiedResult] = await meter(
      (_session: Session<SignMessageRequest | PnpQuotaRequest>) =>
        Promise.allSettled([
          getWalletAddress(session.logger, account),
          hashedPhoneNumber
            ? isVerified(account, hashedPhoneNumber, getContractKit(), session.logger)
            : Promise.resolve(false),
        ]),
      [session],
      (err: any) => {
        throw err
      },
      Histograms.getRemainingQueryCountInstrumentation,
      'getWalletAddressAndIsVerified'
    )

    let hadBlockchainError = false,
      isAccountVerified = false,
      walletAddress = NULL_ADDRESS
    if (walletAddressResult.status === 'fulfilled') {
      walletAddress = walletAddressResult.value
    } else {
      session.logger.error(walletAddressResult.reason)
      hadBlockchainError = true
    }
    if (isVerifiedResult.status === 'fulfilled') {
      isAccountVerified = isVerifiedResult.value
    } else {
      session.logger.error(isVerifiedResult.reason)
      hadBlockchainError = true
    }
    if (hadBlockchainError) {
      session.errors.push(ErrorMessage.CONTRACT_GET_FAILURE)
    }

    if (account.toLowerCase() === walletAddress.toLowerCase()) {
      session.logger.debug('walletAddress is the same as accountAddress')
      walletAddress = NULL_ADDRESS // So we don't double count quota
    }

    return { isAccountVerified, walletAddress }
  }

  protected async getBalances(
    session: Session<SignMessageRequest | PnpQuotaRequest>,
    ...addresses: string[]
  ) {
    const [
      cUSDAccountBalanceResult,
      cEURAccountBalanceResult,
      celoAccountBalanceResult,
    ] = await meter(
      (logger: Logger, ..._addresses: string[]) =>
        Promise.allSettled([
          getStableTokenBalance(StableToken.cUSD, logger, ..._addresses),
          getStableTokenBalance(StableToken.cEUR, logger, ..._addresses),
          getCeloBalance(logger, ..._addresses),
        ]),
      [session.logger, ...addresses],
      (err: any) => {
        throw err
      },
      Histograms.getRemainingQueryCountInstrumentation,
      'getBalances'
    )

    let hadBlockchainError = false
    let cUSDAccountBalance, cEURAccountBalance, celoAccountBalance
    if (cUSDAccountBalanceResult.status === 'fulfilled') {
      cUSDAccountBalance = cUSDAccountBalanceResult.value
    } else {
      session.logger.error(cUSDAccountBalanceResult.reason)
      hadBlockchainError = true
    }
    if (cEURAccountBalanceResult.status === 'fulfilled') {
      cEURAccountBalance = cEURAccountBalanceResult.value
    } else {
      session.logger.error(cEURAccountBalanceResult.reason)
      hadBlockchainError = true
    }
    if (celoAccountBalanceResult.status === 'fulfilled') {
      celoAccountBalance = celoAccountBalanceResult.value
    } else {
      session.logger.error(celoAccountBalanceResult.reason)
      hadBlockchainError = true
    }
    if (hadBlockchainError) {
      session.errors.push(ErrorMessage.CONTRACT_GET_FAILURE)
    }

    return { cUSDAccountBalance, cEURAccountBalance, celoAccountBalance }
  }

  protected async getTotalQuota(
    session: Session<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number> {
    return meter(
      this._getTotalQuota,
      [session],
      (err: any) => {
        throw err
      },
      Histograms.getRemainingQueryCountInstrumentation,
      'getTotalQuota'
    )
  }

  /*
   * Calculates how many queries the caller has unlocked based on the algorithm
   * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
   * If the caller is not verified, they must have a minimum balance to get the unverifiedQueryMax.
   */
  private async _getTotalQuota(
    session: Session<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number> {
    const {
      unverifiedQueryMax,
      additionalVerifiedQueryMax,
      queryPerTransaction,
      minDollarBalance,
      minEuroBalance,
      minCeloBalance,
    } = config.quota // TODO(Alec): where should we be getting config from?

    const { account } = session.request.body

    const { walletAddress, isAccountVerified } = await this.getWalletAddressAndIsVerified(session)

    if (walletAddress !== NULL_ADDRESS) {
      Counters.requestsWithWalletAddress.inc()
    }

    const transactionCount = await getTransactionCount(
      session.logger,
      account,
      walletAddress // TODO(Alec): Make sure we filter out null address in getTransactionCount
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
    // TODO(Alec): We'll need to update verification heuristic for ASv2
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

  private bypassQuotaForE2ETesting(requestBody: SignMessageRequest): boolean {
    const sessionID = Number(requestBody.sessionID)
    return (
      !Number.isNaN(sessionID) && sessionID % 100 < config.test_quota_bypass_percentage // TODO(Alec): add sessionID to Session?
    )
  }
}
