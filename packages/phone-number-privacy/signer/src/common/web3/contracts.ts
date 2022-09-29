import { NULL_ADDRESS, retryAsyncWithBackOffAndTimeout } from '@celo/base'
import { ContractKit, StableToken } from '@celo/contractkit'
import {
  FULL_NODE_TIMEOUT_IN_MS,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
} from '@celo/phone-number-privacy-common'
import { BigNumber } from 'bignumber.js'
import Logger from 'bunyan'
import { Counters, Histograms, Labels, meter } from '../metrics'

export async function getBlockNumber(kit: ContractKit): Promise<number> {
  return meter(
    retryAsyncWithBackOffAndTimeout,
    [
      () => kit.connection.getBlockNumber(),
      RETRY_COUNT,
      [],
      RETRY_DELAY_IN_MS,
      undefined,
      FULL_NODE_TIMEOUT_IN_MS,
    ],
    (err: any) => {
      Counters.blockchainErrors.labels(Labels.READ).inc()
      throw err
    },
    Histograms.getBlindedSigInstrumentation,
    ['getBlockNumber']
  )
}

export async function getTransactionCount(
  kit: ContractKit,
  logger: Logger,
  endpoint: string,
  ...addresses: string[]
): Promise<number> {
  const _getTransactionCount = (...params: string[]) =>
    Promise.all(
      params
        .filter((address) => address !== NULL_ADDRESS)
        .map((address) =>
          retryAsyncWithBackOffAndTimeout(
            () => kit.connection.getTransactionCount(address),
            RETRY_COUNT,
            [],
            RETRY_DELAY_IN_MS,
            undefined,
            FULL_NODE_TIMEOUT_IN_MS
          ).catch((err) => {
            Counters.blockchainErrors.labels(Labels.READ).inc()
            throw err
          })
        )
    ).then((values) => {
      logger.trace({ addresses, txCounts: values }, 'Fetched txCounts for addresses')
      return values.reduce((a, b) => a + b)
    })
  return meter(
    _getTransactionCount,
    addresses,
    (err: any) => {
      throw err
    },
    Histograms.getRemainingQueryCountInstrumentation,
    ['getTransactionCount', endpoint]
  )
}

export async function getStableTokenBalance(
  kit: ContractKit,
  stableToken: StableToken,
  logger: Logger,
  endpoint: string,
  ...addresses: string[]
): Promise<BigNumber> {
  const _getStableTokenBalance = (...params: string[]) =>
    Promise.all(
      params
        .filter((address) => address !== NULL_ADDRESS)
        .map((address) =>
          retryAsyncWithBackOffAndTimeout(
            async () => (await kit.contracts.getStableToken(stableToken)).balanceOf(address),
            RETRY_COUNT,
            [],
            RETRY_DELAY_IN_MS,
            undefined,
            FULL_NODE_TIMEOUT_IN_MS
          ).catch((err) => {
            Counters.blockchainErrors.labels(Labels.READ).inc()
            throw err
          })
        )
    ).then((values) => {
      logger.trace(
        { addresses, balances: values.map((bn) => bn.toString()) },
        `Fetched ${stableToken} balances for addresses`
      )
      return values.reduce((a, b) => a.plus(b))
    })
  return meter(
    _getStableTokenBalance,
    addresses,
    (err: any) => {
      throw err
    },
    Histograms.getRemainingQueryCountInstrumentation,
    ['getStableTokenBalance', endpoint]
  )
}

export async function getCeloBalance(
  kit: ContractKit,
  logger: Logger,
  endpoint: string,
  ...addresses: string[]
): Promise<BigNumber> {
  const _getCeloBalance = (...params: string[]) =>
    Promise.all(
      params
        .filter((address) => address !== NULL_ADDRESS)
        .map((address) =>
          retryAsyncWithBackOffAndTimeout(
            async () => (await kit.contracts.getGoldToken()).balanceOf(address),
            RETRY_COUNT,
            [],
            RETRY_DELAY_IN_MS,
            undefined,
            FULL_NODE_TIMEOUT_IN_MS
          ).catch((err) => {
            Counters.blockchainErrors.labels(Labels.READ).inc()
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
  return meter(
    _getCeloBalance,
    addresses,
    (err: any) => {
      throw err
    },
    Histograms.getRemainingQueryCountInstrumentation,
    ['getStableTokenBalance', endpoint]
  )
}

export async function getWalletAddress(
  kit: ContractKit,
  logger: Logger,
  account: string,
  endpoint: string
): Promise<string> {
  return meter(
    retryAsyncWithBackOffAndTimeout,
    [
      async () => (await kit.contracts.getAccounts()).getWalletAddress(account),
      RETRY_COUNT,
      [],
      RETRY_DELAY_IN_MS,
      undefined,
      FULL_NODE_TIMEOUT_IN_MS,
    ],
    (err: any) => {
      logger.error({ err, account }, 'failed to get wallet address for account')
      Counters.blockchainErrors.labels(Labels.READ).inc()
      return NULL_ADDRESS
    },
    Histograms.getRemainingQueryCountInstrumentation,
    ['getWalletAddress', endpoint]
  )
}

export async function getOnChainOdisPayments(
  kit: ContractKit,
  logger: Logger,
  account: string,
  endpoint: string
): Promise<BigNumber> {
  return meter(
    retryAsyncWithBackOffAndTimeout,
    [
      async () => (await kit.contracts.getOdisPayments()).totalPaidCUSD(account),
      RETRY_COUNT,
      [],
      RETRY_DELAY_IN_MS,
      undefined,
      FULL_NODE_TIMEOUT_IN_MS,
    ],
    (err: any) => {
      logger.error({ err, account }, 'failed to get on-chain odis balance for account')
      Counters.blockchainErrors.labels(Labels.READ).inc()
      throw err
    },
    Histograms.getRemainingQueryCountInstrumentation,
    ['getOnChainOdisPayments', endpoint]
  )
}
