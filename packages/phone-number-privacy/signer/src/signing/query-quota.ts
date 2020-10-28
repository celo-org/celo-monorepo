import {
  authenticateUser,
  ErrorMessage,
  hasValidAccountParam,
  isBodyReasonablySized,
  isVerified,
  logger,
  phoneNumberHashIsValidIfExists,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import { BigNumber } from 'bignumber.js'
import { Request, Response } from 'express'
import { respondWithError } from '../common/error-utils'
import config, { getVersion } from '../config'
import { getPerformedQueryCount } from '../database/wrappers/account'
import { getContractKit } from '../web3/contracts'

export interface GetQuotaRequest {
  account: string
  hashedPhoneNumber?: string
}

export async function handleGetQuota(
  request: Request<{}, {}, GetQuotaRequest>,
  response: Response
) {
  logger.info('Begin getQuota request')
  try {
    if (!isValidGetQuotaInput(request.body)) {
      respondWithError(response, 400, WarningMessage.INVALID_INPUT)
      return
    }
    if (!(await authenticateUser(request, getContractKit()))) {
      respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER)
      return
    }

    const { account, hashedPhoneNumber } = request.body

    const queryCount = await getRemainingQueryCount(account, hashedPhoneNumber)

    response.status(200).json({
      success: true,
      version: getVersion(),
      performedQueryCount: queryCount.performedQueryCount,
      totalQuota: queryCount.totalQuota,
    })
  } catch (err) {
    logger.error({ err }, 'Failed to get user quota')
    respondWithError(response, 500, ErrorMessage.DATABASE_GET_FAILURE)
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
  account: string,
  hashedPhoneNumber?: string
): Promise<{ performedQueryCount: number; totalQuota: number }> {
  logger.debug('Retrieving remaining query count')
  const totalQuota = await getQueryQuota(account, hashedPhoneNumber)
  const performedQueryCount = await getPerformedQueryCount(account)
  return { performedQueryCount, totalQuota }
}

/*
 * Calculates how many queries the caller has unlocked based on the algorithm
 * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
 * If the caller is not verified, they must have a minimum balance to get the unverifiedQueryMax.
 */
async function getQueryQuota(account: string, hashedPhoneNumber?: string) {
  const walletAddress = await getWalletAddress(account)

  if (hashedPhoneNumber && (await isVerified(account, hashedPhoneNumber, getContractKit()))) {
    logger.debug('Account is verified')
    const transactionCount = await getTransactionCount(account, walletAddress)
    return (
      config.quota.unverifiedQueryMax +
      config.quota.additionalVerifiedQueryMax +
      config.quota.queryPerTransaction * transactionCount
    )
  }

  let cUSDAccountBalance = new BigNumber(0)
  let celoAccountBalance = new BigNumber(0)

  await Promise.all([
    new Promise((resolve) => {
      resolve(getDollarBalance(account, walletAddress))
    }),
    new Promise((resolve) => {
      resolve(getCeloBalance(account, walletAddress))
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
    logger.debug({ account }, 'Account is not verified but meets min balance')
    // TODO consider granting these unverified users slightly less queryPerTx
    const transactionCount = await getTransactionCount(account, walletAddress)
    return config.quota.unverifiedQueryMax + config.quota.queryPerTransaction * transactionCount
  }

  logger.debug({ account }, 'Account does not meet query quota criteria')
  return 0
}

export async function getTransactionCount(...addresses: string[]): Promise<number> {
  return Promise.all(
    addresses
      .filter((address) => address !== '0x0')
      .map((address) =>
        retryAsyncWithBackOff(
          () => getContractKit().web3.eth.getTransactionCount(address),
          RETRY_COUNT,
          [],
          RETRY_DELAY_IN_MS
        )
      )
  ).then((values) => values.reduce((a, b) => a + b))
}

export async function getDollarBalance(...addresses: string[]): Promise<BigNumber> {
  return Promise.all(
    addresses
      .filter((address) => address !== '0x0')
      .map((address) =>
        retryAsyncWithBackOff(
          async () => (await getContractKit().contracts.getStableToken()).balanceOf(address),
          RETRY_COUNT,
          [],
          RETRY_DELAY_IN_MS
        )
      )
  ).then((values) => values.reduce((a, b) => a.plus(b)))
}

export async function getCeloBalance(...addresses: string[]): Promise<BigNumber> {
  return Promise.all(
    addresses
      .filter((address) => address !== '0x0')
      .map((address) =>
        retryAsyncWithBackOff(
          async () => (await getContractKit().contracts.getGoldToken()).balanceOf(address),
          RETRY_COUNT,
          [],
          RETRY_DELAY_IN_MS
        )
      )
  ).then((values) => values.reduce((a, b) => a.plus(b)))
}

export async function getWalletAddress(account: string): Promise<string> {
  try {
    return retryAsyncWithBackOff(
      async () => (await getContractKit().contracts.getAccounts()).getWalletAddress(account),
      RETRY_COUNT,
      [],
      RETRY_DELAY_IN_MS
    )
  } catch (err) {
    logger.error({ err, account }, 'failed to get wallet address for account')
    return '0x0'
  }
}
