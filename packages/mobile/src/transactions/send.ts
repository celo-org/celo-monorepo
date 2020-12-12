import { CeloTxObject, CeloTxReceipt } from '@celo/connect'
import { CURRENCY_ENUM } from '@celo/utils/src'
import { BigNumber } from 'bignumber.js'
import { call, cancel, cancelled, delay, fork, join, race, select } from 'redux-saga/effects'
import { TransactionEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEFAULT_FORNO_URL } from 'src/config'
import { getCurrencyAddress, getTokenContract } from 'src/tokens/saga'
import {
  sendTransactionAsync,
  SendTransactionLogEvent,
  SendTransactionLogEventType,
} from 'src/transactions/contract-utils'
import { TransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { assertNever } from 'src/utils/typescript'
import { getGasPrice } from 'src/web3/gas'
import { fornoSelector } from 'src/web3/selectors'

const TAG = 'transactions/send'

// TODO(Rossy) We need to avoid retries for now because we don't have a way of forcing serialization
// in cases where we have multiple parallel txs, like in verification. The nonces can get mixed up
// causing failures when a tx times out (rare but can happen on slow devices)
const TX_NUM_TRIES = 1 // Try txs up to this many times
const TX_RETRY_DELAY = 2000 // 2s
const NONCE_TOO_LOW_ERROR = 'nonce too low'
const OUT_OF_GAS_ERROR = 'out of gas'
const ALWAYS_FAILING_ERROR = 'always failing transaction'
const KNOWN_TX_ERROR = 'known transaction'

// 90s. Maximum total time to wait for confirmation when sending a transaction. (Includes grace period)
const TX_TIMEOUT = 90000
// 5000 ms. After a timeout triggers, time to wait before throwing an error.
// Gives time reconnect and fetch receipts in case network conditions change while the app is suspended.
const TX_TIMEOUT_GRACE_PERIOD = 5000

const getLogger = (context: TransactionContext, fornoMode?: boolean) => {
  const txId = context.id
  const tag = context.tag ?? TAG
  return (event: SendTransactionLogEvent) => {
    switch (event.type) {
      case SendTransactionLogEventType.Started:
        Logger.debug(tag, `Sending transaction with id ${txId}`)
        ValoraAnalytics.track(TransactionEvents.transaction_start, {
          txId,
          description: context.description,
          fornoMode,
        })
        break
      case SendTransactionLogEventType.EstimatedGas:
        Logger.debug(
          tag,
          `Transaction with id ${txId} ${
            event.prefilled ? 'using provided estimate' : 'estimated'
          } gas: ${event.gas}`
        )
        ValoraAnalytics.track(TransactionEvents.transaction_gas_estimated, {
          txId,
          estimatedGas: event.gas,
          prefilled: event.prefilled,
        })
        break
      case SendTransactionLogEventType.TransactionHashReceived:
        Logger.debug(tag, `Transaction id ${txId} hash received: ${event.hash}`)
        ValoraAnalytics.track(TransactionEvents.transaction_hash_received, {
          txId,
          txHash: event.hash,
        })
        break
      case SendTransactionLogEventType.Confirmed:
        if (event.number > 0) {
          Logger.warn(tag, `Transaction id ${txId} extra confirmation received: ${event.number}`)
        }
        Logger.debug(tag, `Transaction confirmed with id: ${txId}`)
        ValoraAnalytics.track(TransactionEvents.transaction_confirmed, { txId })
        break
      case SendTransactionLogEventType.ReceiptReceived:
        Logger.debug(
          tag,
          `Transaction id ${txId} received receipt: ${JSON.stringify(event.receipt)}`
        )
        ValoraAnalytics.track(TransactionEvents.transaction_receipt_received, { txId })
        break
      case SendTransactionLogEventType.Failed:
        Logger.error(tag, `Transaction failed: ${txId}`, event.error)
        ValoraAnalytics.track(TransactionEvents.transaction_error, {
          txId,
          error: event.error.message,
        })
        break
      case SendTransactionLogEventType.Exception:
        Logger.error(tag, `Transaction Exception caught ${txId}: `, event.error)
        ValoraAnalytics.track(TransactionEvents.transaction_exception, {
          txId,
          error: event.error.message,
        })
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
  tx: CeloTxObject<any>,
  account: string,
  context: TransactionContext,
  preferredFeeCurrency: CURRENCY_ENUM = CURRENCY_ENUM.DOLLAR,
  gas?: number,
  gasPrice?: BigNumber,
  nonce?: number
) {
  Logger.debug(
    `${TAG}@sendTransactionPromises`,
    `Going to send a transaction with id ${context.id}`
  )

  const stableToken = yield getTokenContract(CURRENCY_ENUM.DOLLAR)
  const stableTokenBalance = yield call([stableToken, stableToken.balanceOf], account)
  const fornoMode: boolean = yield select(fornoSelector)

  if (gas || gasPrice) {
    Logger.debug(
      `${TAG}@sendTransactionPromises`,
      `Using provided gas parameters: ${gas} gas @ ${gasPrice} ${preferredFeeCurrency}`
    )
  }

  // If stableToken is prefered to pay fee, use it unless its balance is Zero,
  // in that case use CELO to pay fee.
  // TODO: Make it transparent for the user.
  // TODO: Check for balance should be more than fee instead of zero.
  const feeCurrency =
    preferredFeeCurrency === CURRENCY_ENUM.DOLLAR && stableTokenBalance.isGreaterThan(0)
      ? CURRENCY_ENUM.DOLLAR
      : CURRENCY_ENUM.GOLD
  if (preferredFeeCurrency && feeCurrency !== preferredFeeCurrency) {
    Logger.warn(
      `${TAG}@sendTransactionPromises`,
      `Using fallback fee currency ${feeCurrency} instead of preferred ${preferredFeeCurrency}.`
    )
    // If the currency is changed, the gas value and price are invalidated.
    // TODO: Move the fallback currency logic up the stackso this will never happen.
    if (gas || gasPrice) {
      Logger.warn(
        `${TAG}@sendTransactionPromises`,
        `Resetting gas parameters because fee currency was changed.`
      )
      gas = undefined
      gasPrice = undefined
    }
  }

  const feeCurrencyAddress =
    feeCurrency === CURRENCY_ENUM.DOLLAR
      ? yield call(getCurrencyAddress, CURRENCY_ENUM.DOLLAR)
      : undefined // Pass undefined to use CELO to pay for gas.

  Logger.debug(
    `${TAG}@sendTransactionPromises`,
    `Sending tx ${context.id} in ${fornoMode ? 'forno' : 'geth'} mode`
  )
  if (fornoMode) {
    // In dev mode, verify that we are actually able to connect to the network. This
    // ensures that we get a more meaningful error if the forno server is down, which
    // can happen with networks without SLA guarantees like `integration`.
    if (__DEV__) {
      yield call(verifyUrlWorksOrThrow, DEFAULT_FORNO_URL)
    }

    if (!gasPrice) {
      gasPrice = yield getGasPrice(feeCurrency)
    }
  }

  const transactionPromises = yield call(
    sendTransactionAsync,
    tx,
    account,
    feeCurrencyAddress,
    getLogger(context, fornoMode),
    gas,
    gasPrice?.toString(),
    nonce
  )
  return transactionPromises
}

// Send a transaction and await for its confirmation
// Use this method for sending transactions and awaiting them to be confirmed
export function* sendTransaction(
  tx: CeloTxObject<any>,
  account: string,
  context: TransactionContext,
  gas?: number,
  gasPrice?: BigNumber,
  feeCurrency?: CURRENCY_ENUM
) {
  const sendTxMethod = function*(nonce?: number) {
    const { receipt } = yield call(
      sendTransactionPromises,
      tx,
      account,
      context,
      feeCurrency,
      gas,
      gasPrice,
      nonce
    )
    return yield receipt
  }
  return yield call(wrapSendTransactionWithRetry, sendTxMethod, context)
}

// SendTransactionMethod is a redux saga generator that takes a nonce and returns a receipt.
type SendTransactionMethod = (nonce?: number) => Generator<any, CeloTxReceipt, any>

export function* wrapSendTransactionWithRetry(
  sendTxMethod: SendTransactionMethod,
  context: TransactionContext
) {
  for (let i = 1; i <= TX_NUM_TRIES; i++) {
    try {
      // Spin tx send into a Task so that it does not get cancelled automatically on timeout.
      const task = yield fork(sendTxMethod)
      let { receipt, timeout } = yield race({
        receipt: join(task),
        timeout: delay(TX_TIMEOUT * i - TX_TIMEOUT_GRACE_PERIOD),
      })

      // In some conditions (e.g. app backgrounding) the app may become suspended, preventing the
      // send task from making progress. If this occurs for long enough that the timeout elapses, a
      // timeout may be triggered even if the transaction send is complete. A second race is
      // triggered here to handle these cases by giving the send task a grace period to return a
      // result after the initial timeout fires.
      if (timeout && TX_TIMEOUT_GRACE_PERIOD > 0) {
        Logger.debug(
          `${TAG}@wrapSendTransactionWithRetry`,
          `tx ${context.id} entering timeout grace period for attempt ${i}`
        )
        ;({ receipt, timeout } = yield race({
          receipt: join(task),
          timeout: delay(TX_TIMEOUT_GRACE_PERIOD),
        }))
      }

      // Cancel the send task if it is still running. If terminated, this is a no-op.
      yield cancel(task)

      if (timeout) {
        Logger.error(
          `${TAG}@wrapSendTransactionWithRetry`,
          `tx ${context.id} timeout for attempt ${i}`
        )
        throw new Error(ErrorMessages.TRANSACTION_TIMEOUT)
      }

      Logger.debug(
        `${TAG}@wrapSendTransactionWithRetry`,
        `tx ${context.id} successful for attempt ${i}`
      )
      return receipt
    } catch (err) {
      Logger.error(`${TAG}@wrapSendTransactionWithRetry`, `Tx ${context.id} failed`, err)

      if (!shouldTxFailureRetry(err)) {
        throw err
      }

      if (i + 1 <= TX_NUM_TRIES) {
        yield delay(TX_RETRY_DELAY)
        Logger.debug(
          `${TAG}@wrapSendTransactionWithRetry`,
          `Tx ${context.id} retrying attempt ${i + 1}`
        )
      } else {
        throw err
      }
    } finally {
      if (yield cancelled()) {
        Logger.warn(
          `${TAG}@wrapSendTransactionWithRetry`,
          `tx ${context.id} cancelled on attempt ${i}`
        )
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
    Logger.error(
      `${TAG}@shouldTxFailureRetry`,
      'Out of gas or invalid tx error. Will not reattempt.'
    )
    return false
  }

  // Similar to case above
  if (message.includes(ALWAYS_FAILING_ERROR)) {
    Logger.error(`${TAG}@shouldTxFailureRetry`, 'Transaction always failing. Will not reattempt')
    return false
  }

  // Geth already knows about the tx of this nonce, no point in resending it
  if (message.includes(KNOWN_TX_ERROR)) {
    Logger.error(`${TAG}@shouldTxFailureRetry`, 'Known transaction error. Will not reattempt.')
    return false
  }

  // Nonce too low, probably because the tx already went through
  if (message.includes(NONCE_TOO_LOW_ERROR)) {
    Logger.error(
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
