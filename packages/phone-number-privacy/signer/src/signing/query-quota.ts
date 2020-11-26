import { NULL_ADDRESS } from '@celo/contractkit'
import {
  authenticateUser,
  ErrorMessage,
  hasValidAccountParam,
  isBodyReasonablySized,
  isVerified,
  phoneNumberHashIsValidIfExists,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import { BigNumber } from 'bignumber.js'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import allSettled from 'promise.allsettled'
import { respondWithError } from '../common/error-utils'
import { Counters, Histograms } from '../common/metrics'
import config, { getVersion } from '../config'
import { getPerformedQueryCount } from '../database/wrappers/account'
import { Endpoints } from '../server'
import { getContractKit } from '../web3/contracts'

allSettled.shim()

export interface GetQuotaRequest {
  account: string
  hashedPhoneNumber?: string
  sessionID?: string
}

export interface GetQuotaResponse {
  success: boolean
  version: string
  performedQueryCount: number
  totalQuota: number
}

export async function handleGetQuota(
  request: Request<{}, {}, GetQuotaRequest>,
  response: Response
) {
  Counters.requests.labels(Endpoints.GET_QUOTA).inc()
  const logger: Logger = response.locals.logger
  logger.info('Begin getQuota request')
  try {
    if (!isValidGetQuotaInput(request.body)) {
      respondWithError(Endpoints.GET_QUOTA, response, 400, WarningMessage.INVALID_INPUT)
      return
    }
    if (!(await authenticateUser(request, getContractKit(), logger))) {
      respondWithError(Endpoints.GET_QUOTA, response, 401, WarningMessage.UNAUTHENTICATED_USER)
      return
    }

    const { account, hashedPhoneNumber } = request.body

    const queryCount = await getRemainingQueryCount(logger, account, hashedPhoneNumber)

    Counters.responses.labels(Endpoints.GET_QUOTA, '200').inc()

    response.status(200).json({
      success: true,
      version: getVersion(),
      performedQueryCount: queryCount.performedQueryCount,
      totalQuota: queryCount.totalQuota,
    })
  } catch (err) {
    logger.error('Failed to get user quota')
    logger.error({ err })
    respondWithError(Endpoints.GET_QUOTA, response, 500, ErrorMessage.DATABASE_GET_FAILURE)
  }
}

function isValidGetQuotaInput(requestBody: GetQuotaRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    phoneNumberHashIsValidIfExists(requestBody) &&
    isBodyReasonablySized(requestBody)
  )
}

/*
 * Returns the number of queries already performed and the calculated query quota.
 */
export async function getRemainingQueryCount(
  logger: Logger,
  account: string,
  hashedPhoneNumber?: string
): Promise<{ performedQueryCount: number; totalQuota: number }> {
  logger.debug('Retrieving remaining query count')
  const [totalQuota, performedQueryCount] = await Promise.all([
    getQueryQuota(logger, account, hashedPhoneNumber),
    getPerformedQueryCount(account, logger),
  ])
  Histograms.userRemainingQuotaAtRequest.observe(totalQuota - performedQueryCount)
  return { performedQueryCount, totalQuota }
}

/*
 * Calculates how many queries the caller has unlocked based on the algorithm
 * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
 * If the caller is not verified, they must have a minimum balance to get the unverifiedQueryMax.
 */
async function getQueryQuota(logger: Logger, account: string, hashedPhoneNumber?: string) {
  const [_walletAddress, _isAccountVerified] = await Promise.allSettled([
    getWalletAddress(logger, account),
    new Promise((resolve) =>
      resolve(
        hashedPhoneNumber ? isVerified(account, hashedPhoneNumber, getContractKit(), logger) : false
      )
    ),
  ])
  let walletAddress = _walletAddress.status === 'fulfilled' ? _walletAddress.value : NULL_ADDRESS
  const isAccountVerified =
    _isAccountVerified.status === 'fulfilled' ? _isAccountVerified.value : false

  logger.debug({ account, walletAddress }, 'begin getQueryQuota')

  if (account.toLowerCase() === walletAddress.toLowerCase()) {
    logger.debug('walletAddress is the same as accountAddress')
    walletAddress = NULL_ADDRESS
  }

  if (walletAddress !== NULL_ADDRESS) {
    Counters.requestsWithWalletAddress.inc()
  }

  if (isAccountVerified) {
    Counters.requestsWithVerifiedAccount.inc()
    logger.debug({ account }, 'Account is verified')
    const transactionCount = await getTransactionCount(logger, account, walletAddress)
    const quota =
      config.quota.unverifiedQueryMax +
      config.quota.additionalVerifiedQueryMax +
      config.quota.queryPerTransaction * transactionCount

    logger.trace({
      unverifiedQueryMax: config.quota.unverifiedQueryMax,
      additionalVerifiedQueryMax: config.quota.additionalVerifiedQueryMax,
      queryPerTransaction: config.quota.queryPerTransaction,
      transactionCount,
      quota,
    })

    return quota
  }

  let cUSDAccountBalance = new BigNumber(0)
  let celoAccountBalance = new BigNumber(0)

  await Promise.all([
    new Promise((resolve) => {
      resolve(getDollarBalance(logger, account, walletAddress))
    }),
    new Promise((resolve) => {
      resolve(getCeloBalance(logger, account, walletAddress))
    }),
  ]).then((values) => {
    cUSDAccountBalance = values[0] as BigNumber
    celoAccountBalance = values[1] as BigNumber
  })

  // Min balance can be in either cUSD or CELO
  if (
    cUSDAccountBalance.isGreaterThanOrEqualTo(config.quota.minDollarBalance) ||
    celoAccountBalance.isGreaterThanOrEqualTo(config.quota.minCeloBalance)
  ) {
    Counters.requestsWithUnverifiedAccountWithMinBalance.inc()
    logger.debug(
      {
        account,
        cUSDAccountBalance,
        celoAccountBalance,
        minDollarBalance: config.quota.minDollarBalance,
        minCeloBalance: config.quota.minCeloBalance,
      },
      'Account is not verified but meets min balance'
    )
    // TODO consider granting these unverified users slightly less queryPerTx
    const transactionCount = await getTransactionCount(logger, account, walletAddress)

    const quota =
      config.quota.unverifiedQueryMax + config.quota.queryPerTransaction * transactionCount

    logger.trace({
      unverifiedQueryMax: config.quota.unverifiedQueryMax,
      queryPerTransaction: config.quota.queryPerTransaction,
      transactionCount,
      quota,
    })

    return quota
  }

  logger.trace({
    account,
    cUSDAccountBalance,
    celoAccountBalance,
    minDollarBalance: config.quota.minDollarBalance,
    minCeloBalance: config.quota.minCeloBalance,
    quota: 0,
  })
  logger.debug({ account }, 'Account is not verified and does not meet min balance')

  return 0
}

export async function getTransactionCount(logger: Logger, ...addresses: string[]): Promise<number> {
  return Promise.all(
    addresses
      .filter((address) => address !== NULL_ADDRESS)
      .map((address) =>
        retryAsyncWithBackOff(
          () => getContractKit().web3.eth.getTransactionCount(address),
          RETRY_COUNT,
          [],
          RETRY_DELAY_IN_MS
        )
      )
  ).then((values) => {
    logger.trace({ addresses, txCounts: values }, 'Fetched txCounts for addresses')
    return values.reduce((a, b) => a + b)
  })
}

export async function getDollarBalance(logger: Logger, ...addresses: string[]): Promise<BigNumber> {
  return Promise.all(
    addresses
      .filter((address) => address !== NULL_ADDRESS)
      .map((address) =>
        retryAsyncWithBackOff(
          async () => (await getContractKit().contracts.getStableToken()).balanceOf(address),
          RETRY_COUNT,
          [],
          RETRY_DELAY_IN_MS
        )
      )
  ).then((values) => {
    logger.trace({ addresses, balances: values }, 'Fetched cusd balances for addresses')
    return values.reduce((a, b) => a.plus(b))
  })
}

export async function getCeloBalance(logger: Logger, ...addresses: string[]): Promise<BigNumber> {
  return Promise.all(
    addresses
      .filter((address) => address !== NULL_ADDRESS)
      .map((address) =>
        retryAsyncWithBackOff(
          async () => (await getContractKit().contracts.getGoldToken()).balanceOf(address),
          RETRY_COUNT,
          [],
          RETRY_DELAY_IN_MS
        )
      )
  ).then((values) => {
    logger.trace({ addresses, balances: values }, 'Fetched celo balances for addresses')
    return values.reduce((a, b) => a.plus(b))
  })
}

export async function getWalletAddress(logger: Logger, account: string): Promise<string> {
  try {
    return retryAsyncWithBackOff(
      async () => (await getContractKit().contracts.getAccounts()).getWalletAddress(account),
      RETRY_COUNT,
      [],
      RETRY_DELAY_IN_MS
    )
  } catch (err) {
    logger.error({ account }, 'failed to get wallet address for account')
    logger.error({ err })
    return NULL_ADDRESS
  }
}
