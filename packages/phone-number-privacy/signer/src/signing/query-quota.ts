import { retryAsyncWithBackOffAndTimeout } from '@celo/base'
import { NULL_ADDRESS } from '@celo/contractkit'
import {
  authenticateUser,
  ErrorMessage,
  FULL_NODE_TIMEOUT_IN_MS,
  GetQuotaRequest,
  hasValidAccountParam,
  isBodyReasonablySized,
  isVerified,
  phoneNumberHashIsValidIfExists,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { BigNumber } from 'bignumber.js'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import allSettled from 'promise.allsettled'
import { respondWithError } from '../common/error-utils'
import { Counters, Histograms, Labels } from '../common/metrics'
import config, { getVersion } from '../config'
import { getPerformedQueryCount } from '../database/wrappers/account'
import { Endpoints } from '../server'
import { getContractKit } from '../web3/contracts'

allSettled.shim()

export async function handleGetQuota(
  request: Request<{}, {}, GetQuotaRequest>,
  response: Response
) {
  Counters.requests.labels(Endpoints.GET_QUOTA).inc()
  const logger: Logger = response.locals.logger
  logger.info({ request: request.body }, 'Request received')
  logger.debug('Begin handleGetQuota')
  try {
    if (!isValidGetQuotaInput(request.body)) {
      respondWithError(Endpoints.GET_QUOTA, response, 400, WarningMessage.INVALID_INPUT)
      return
    }
    if (!(await authenticateUser(request, getContractKit() as any, logger))) {
      respondWithError(Endpoints.GET_QUOTA, response, 401, WarningMessage.UNAUTHENTICATED_USER)
      return
    }

    const { account, hashedPhoneNumber } = request.body

    const queryCount = await getRemainingQueryCount(logger, account, hashedPhoneNumber)

    const queryQuotaResponse = {
      success: true,
      version: getVersion(),
      performedQueryCount: queryCount.performedQueryCount,
      totalQuota: queryCount.totalQuota,
    }

    Counters.responses.labels(Endpoints.GET_QUOTA, '200').inc()
    logger.info({ response: queryQuotaResponse }, 'Query quota retrieval success')
    response.status(200).json(queryQuotaResponse)
  } catch (err) {
    logger.error('Failed to get user quota')
    logger.error(err)
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
  logger.debug({ account }, 'Retrieving remaining query count')
  const meterGetRemainingQueryCount = Histograms.getRemainingQueryCountInstrumentation
    .labels('getRemainingQueryCount')
    .startTimer()
  const [totalQuota, performedQueryCount] = await Promise.all([
    getQueryQuota(logger, account, hashedPhoneNumber),
    getPerformedQueryCount(account, logger),
  ]).finally(meterGetRemainingQueryCount)
  Histograms.userRemainingQuotaAtRequest.observe(totalQuota - performedQueryCount)
  return { performedQueryCount, totalQuota }
}

async function getQueryQuota(logger: Logger, account: string, hashedPhoneNumber?: string) {
  const getQueryQuotaMeter = Histograms.getRemainingQueryCountInstrumentation
    .labels('getQueryQuota')
    .startTimer()
  return _getQueryQuota(logger, account, hashedPhoneNumber).finally(getQueryQuotaMeter)
}

/*
 * Calculates how many queries the caller has unlocked based on the algorithm
 * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
 * If the caller is not verified, they must have a minimum balance to get the unverifiedQueryMax.
 */
async function _getQueryQuota(logger: Logger, account: string, hashedPhoneNumber?: string) {
  const getWalletAddressAndIsVerifiedMeter = Histograms.getRemainingQueryCountInstrumentation
    .labels('getWalletAddressAndIsVerified')
    .startTimer()
  const [_walletAddress, _isAccountVerified] = await Promise.allSettled([
    getWalletAddress(logger, account),
    new Promise((resolve) =>
      resolve(
        hashedPhoneNumber
          ? isVerified(account, hashedPhoneNumber, getContractKit() as any, logger)
          : false
      )
    ),
  ]).finally(getWalletAddressAndIsVerifiedMeter)

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

  const getBalancesMeter = Histograms.getRemainingQueryCountInstrumentation
    .labels('balances')
    .startTimer()
  let cUSDAccountBalance = new BigNumber(0)
  let celoAccountBalance = new BigNumber(0)

  await Promise.all([
    new Promise((resolve) => {
      resolve(getDollarBalance(logger, account, walletAddress))
    }),
    new Promise((resolve) => {
      resolve(getCeloBalance(logger, account, walletAddress))
    }),
  ])
    .then((values) => {
      cUSDAccountBalance = values[0] as BigNumber
      celoAccountBalance = values[1] as BigNumber
    })
    .finally(getBalancesMeter)

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
  const getTransactionCountMeter = Histograms.getRemainingQueryCountInstrumentation
    .labels('getTransactionCount')
    .startTimer()
  const res = Promise.all(
    addresses
      .filter((address) => address !== NULL_ADDRESS)
      .map((address) =>
        retryAsyncWithBackOffAndTimeout(
          () => getContractKit().connection.getTransactionCount(address),
          RETRY_COUNT,
          [],
          RETRY_DELAY_IN_MS,
          undefined,
          FULL_NODE_TIMEOUT_IN_MS
        ).catch((err) => {
          Counters.blockchainErrors.labels(Labels.read).inc()
          throw err
        })
      )
  )
    .then((values) => {
      logger.trace({ addresses, txCounts: values }, 'Fetched txCounts for addresses')
      return values.reduce((a, b) => a + b)
    })
    .finally(getTransactionCountMeter)
  return res
}

export async function getDollarBalance(logger: Logger, ...addresses: string[]): Promise<BigNumber> {
  return Promise.all(
    addresses
      .filter((address) => address !== NULL_ADDRESS)
      .map((address) =>
        retryAsyncWithBackOffAndTimeout(
          async () => (await getContractKit().contracts.getStableToken()).balanceOf(address),
          RETRY_COUNT,
          [],
          RETRY_DELAY_IN_MS,
          undefined,
          FULL_NODE_TIMEOUT_IN_MS
        ).catch((err) => {
          Counters.blockchainErrors.labels(Labels.read).inc()
          throw err
        })
      )
  ).then((values) => {
    logger.trace(
      { addresses, balances: values.map((bn) => bn.toString()) },
      'Fetched cusd balances for addresses'
    )
    return values.reduce((a, b) => a.plus(b))
  })
}

export async function getCeloBalance(logger: Logger, ...addresses: string[]): Promise<BigNumber> {
  return Promise.all(
    addresses
      .filter((address) => address !== NULL_ADDRESS)
      .map((address) =>
        retryAsyncWithBackOffAndTimeout(
          async () => (await getContractKit().contracts.getGoldToken()).balanceOf(address),
          RETRY_COUNT,
          [],
          RETRY_DELAY_IN_MS,
          undefined,
          FULL_NODE_TIMEOUT_IN_MS
        ).catch((err) => {
          Counters.blockchainErrors.labels(Labels.read).inc()
          throw err
        })
      )
  ).then((values) => {
    logger.trace(
      { addresses, balances: values.map((bn) => bn.toString()) },
      'Fetched celo balances for addresses'
    )
    return values.reduce((a, b) => a.plus(b))
  })
}

export async function getWalletAddress(logger: Logger, account: string): Promise<string> {
  const getWalletAddressMeter = Histograms.getRemainingQueryCountInstrumentation
    .labels('getWalletAddress')
    .startTimer()
  return retryAsyncWithBackOffAndTimeout(
    async () => (await getContractKit().contracts.getAccounts()).getWalletAddress(account),
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS,
    undefined,
    FULL_NODE_TIMEOUT_IN_MS
  )
    .catch((err: any) => {
      logger.error({ account }, 'failed to get wallet address for account')
      logger.error(err)
      Counters.blockchainErrors.labels(Labels.read).inc()
      return NULL_ADDRESS
    })
    .finally(getWalletAddressMeter)
}
