import {
  getStableTokenContract,
  sendTransactionAsync,
  sendTransactionAsyncWithWeb3Signing,
  SendTransactionLogEvent,
  SendTransactionLogEventType,
} from '@celo/walletkit'
import { call, delay, race, select, take } from 'redux-saga/effects'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEFAULT_FORNO_URL } from 'src/config'
import Logger from 'src/utils/Logger'
import { assertNever } from 'src/utils/typescript'
import { web3 } from 'src/web3/contracts'
import { fornoSelector } from 'src/web3/selectors'
import { getLatestNonce } from 'src/web3/utils'
import { TransactionObject } from 'web3-eth'

const TAG = 'transactions/send'
const TX_NUM_RETRIES = 3 // Try txs up to 3 times
const TX_RETRY_DELAY = 1000 // 1s
const TX_TIMEOUT = 20000 // 20s
const NONCE_TOO_LOW_ERROR = 'nonce too low'
const OUT_OF_GAS_ERROR = 'out of gas'
const KNOWN_TX_ERROR = 'known transaction'

const getLogger = (tag: string, txId: string) => {
  return (event: SendTransactionLogEvent) => {
    switch (event.type) {
      case SendTransactionLogEventType.Confirmed:
        Logger.debug(tag, `Transaction confirmed with id: ${txId}`)
        break
      case SendTransactionLogEventType.EstimatedGas:
        Logger.debug(tag, `Transaction with id ${txId} estimated gas: ${event.gas}`)
        CeloAnalytics.track(CustomEventNames.transaction_send_gas_estimated, { txId })
        break
      case SendTransactionLogEventType.ReceiptReceived:
        Logger.debug(
          tag,
          `Transaction id ${txId} received receipt: ${JSON.stringify(event.receipt)}`
        )
        CeloAnalytics.track(CustomEventNames.transaction_send_gas_receipt, { txId })
        break
      case SendTransactionLogEventType.TransactionHashReceived:
        Logger.debug(tag, `Transaction id ${txId} hash received: ${event.hash}`)
        break
      case SendTransactionLogEventType.Started:
        Logger.debug(tag, `Sending transaction with id ${txId}`)
        CeloAnalytics.track(CustomEventNames.transaction_send_start, { txId })
        break
      case SendTransactionLogEventType.Failed:
        Logger.error(tag, `Transaction failed: ${txId}`, event.error)
        break
      case SendTransactionLogEventType.Exception:
        Logger.error(tag, `Transaction Exception caught ${txId}: `, event.error)
        break
      default:
        assertNever(event)
    }
  }
}

// Sends a transaction and async returns promises for the txhash, confirmation, and receipt
// Only use this method if you need more granular control of the different events
// WARNING: this method doesn't have retry and timeout logic built in, turns out that's tricky
// to get right with this promise set interface. Prefer sendTransaction below
export function* sendTransactionPromises(
  tx: TransactionObject<any>,
  account: string,
  tag: string,
  txId: string,
  nonce: number,
  staticGas?: number
) {
  Logger.debug(`${TAG}@sendTransactionPromises`, `Going to send a transaction with id ${txId}`)
  // Use stabletoken to pay for gas by default
  const stableToken = yield call(getStableTokenContract, web3)
  const fornoMode: boolean = yield select(fornoSelector)

  Logger.debug(
    `${TAG}@sendTransactionPromises`,
    `Sending tx ${txId} in ${fornoMode ? 'forno' : 'geth'} mode`
  )
  // This if-else case is temporary and will disappear once we move from `walletkit` to `contractkit`.
  if (fornoMode) {
    // In dev mode, verify that we are actually able to connect to the network. This
    // ensures that we get a more meaningful error if the forno server is down, which
    // can happen with networks without SLA guarantees like `integration`.
    if (__DEV__) {
      yield call(verifyUrlWorksOrThrow, DEFAULT_FORNO_URL)
    }
    const transactionPromises = yield call(
      sendTransactionAsyncWithWeb3Signing,
      web3,
      tx,
      account,
      stableToken,
      nonce,
      getLogger(tag, txId),
      staticGas
    )
    return transactionPromises
  } else {
    const transactionPromises = yield call(
      sendTransactionAsync,
      tx,
      account,
      stableToken,
      nonce,
      getLogger(tag, txId),
      staticGas
    )
    return transactionPromises
  }
}

// Send a transaction and await for its confirmation
// Use this method for sending transactions and awaiting them to be confirmed
export function* sendTransaction(
  tx: TransactionObject<any>,
  account: string,
  tag: string,
  txId: string,
  staticGas?: number,
  cancelAction?: string
) {
  const sendTxMethod = function*(nonce: number) {
    const { confirmation } = yield call(
      sendTransactionPromises,
      tx,
      account,
      tag,
      txId,
      nonce,
      staticGas
    )
    const result = yield confirmation
    return result
  }
  yield call(wrapSendTransactionWithRetry, txId, account, sendTxMethod, cancelAction)
}

export function* wrapSendTransactionWithRetry(
  txId: string,
  account: string,
  sendTxMethod: (nonce: number) => Generator<any, any, any>,
  cancelAction?: string
) {
  const latestNonce = yield call(getLatestNonce, account)
  for (let i = 1; i <= TX_NUM_RETRIES; i++) {
    try {
      const { result, timeout, cancel } = yield race({
        result: call(sendTxMethod, latestNonce + 1),
        timeout: delay(TX_TIMEOUT * i),
        ...(cancelAction && {
          cancel: take(cancelAction),
        }),
      })

      if (timeout) {
        Logger.error(`${TAG}@wrapSendTransactionWithRetry`, `tx ${txId} timeout for attempt ${i}`)
        throw new Error(ErrorMessages.TRANSACTION_TIMEOUT)
      } else if (cancel) {
        Logger.warn(`${TAG}@wrapSendTransactionWithRetry`, `tx ${txId} cancelled for attempt ${i}`)
        return
      }

      Logger.debug(
        `${TAG}@wrapSendTransactionWithRetry`,
        `tx ${txId} successful for attempt ${i} with result ${result}`
      )
      return
    } catch (err) {
      Logger.error(`${TAG}@wrapSendTransactionWithRetry`, `Tx ${txId} failed`, err)

      if (!shouldTxFailureRetry(err)) {
        return
      }

      if (i + 1 <= TX_NUM_RETRIES) {
        yield delay(TX_RETRY_DELAY)
        Logger.debug(`${TAG}@wrapSendTransactionWithRetry`, `Tx ${txId} retrying attempt ${i + 1}`)
      } else {
        throw err
      }
    }
  }
}

function shouldTxFailureRetry(err: any) {
  if (!err || !err.message || typeof err.message !== 'string') {
    return true
  }
  const message = err.message.toLowerCase()

  // Web3 doesn't like the tx, it's invalid (e.g. fails a require), or funds insufficient
  if (message.includes(OUT_OF_GAS_ERROR)) {
    Logger.debug(
      `${TAG}@shouldTxFailureRetry`,
      'Out of gas or invalid tx error. Will not reattempt.'
    )
    return false
  }

  // Geth already knows about the tx of this nonce, no point in resending it
  if (message.includes(KNOWN_TX_ERROR)) {
    Logger.debug(`${TAG}@shouldTxFailureRetry`, 'Known transaction error. Will not reattempt.')
    return false
  }

  // Nonce too low, probably because the tx already went through
  if (message.includes(NONCE_TOO_LOW_ERROR)) {
    Logger.debug(
      `${TAG}@shouldTxFailureRetry`,
      'Nonce too low, possible from retrying. Will not reattempt.'
    )
    return false
  }

  return true
}

async function verifyUrlWorksOrThrow(url: string) {
  try {
    await fetch(url)
  } catch (e) {
    Logger.error(
      'contracts@verifyUrlWorksOrThrow',
      `Failed to perform HEAD request to url: \"${url}\"`,
      e
    )
    throw new Error(`Failed to perform HEAD request to url: \"${url}\", is it working?`)
  }
}
