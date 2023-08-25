import { retryAsyncWithBackOffAndTimeout } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import {
  FULL_NODE_TIMEOUT_IN_MS,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
} from '@celo/phone-number-privacy-common'
import { BigNumber } from 'bignumber.js'
import Logger from 'bunyan'
import { Counters, Histograms, newMeter } from '../metrics'

export async function getOnChainOdisPayments(
  kit: ContractKit,
  logger: Logger,
  account: string,
  endpoint: string
): Promise<BigNumber> {
  const _meter = newMeter(
    Histograms.getRemainingQueryCountInstrumentation,
    'getOnChainOdisPayments',
    endpoint
  )
  return _meter(() =>
    retryAsyncWithBackOffAndTimeout(
      async () => (await kit.contracts.getOdisPayments()).totalPaidCUSD(account),
      RETRY_COUNT,
      [],
      RETRY_DELAY_IN_MS,
      undefined,
      FULL_NODE_TIMEOUT_IN_MS
    ).catch((err: any) => {
      logger.error({ err, account }, 'failed to get on-chain odis balance for account')
      Counters.blockchainErrors.inc()
      throw err
    })
  )
}
