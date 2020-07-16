import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import { BigNumber } from 'bignumber.js'
import { RETRY_COUNT, RETRY_DELAY_IN_MS } from '../common/constants'
import logger from '../common/logger'
import config from '../config'
import { getPerformedQueryCount } from '../database/wrappers/account'
import { getContractKit, isVerified } from '../web3/contracts'

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
  if (hashedPhoneNumber && (await isVerified(account, hashedPhoneNumber))) {
    logger.debug('Account is verified')
    const transactionCount = await getTransactionCountFromAccount(account)
    return (
      config.salt.unverifiedQueryMax +
      config.salt.additionalVerifiedQueryMax +
      config.salt.queryPerTransaction * transactionCount
    )
  }

  const accountBalance = await getDollarBalance(account)
  if (accountBalance.isGreaterThanOrEqualTo(config.salt.minDollarBalance)) {
    logger.debug('Account is not verified but meets min balance')
    // TODO consider granting these unverified users slightly less queryPerTx
    const transactionCount = await getTransactionCountFromAccount(account)
    return config.salt.unverifiedQueryMax + config.salt.queryPerTransaction * transactionCount
  }

  logger.debug('Account does not meet query quota criteria')
  return 0
}

export async function getTransactionCountFromAccount(account: string): Promise<number> {
  return retryAsyncWithBackOff(
    () => getContractKit().web3.eth.getTransactionCount(account),
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS
  )
}

export async function getDollarBalance(account: string): Promise<BigNumber> {
  return retryAsyncWithBackOff(
    async () => (await getContractKit().contracts.getStableToken()).balanceOf(account),
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS
  )
}
