import {
  getStableTokenContract,
  sendTransactionAsync,
  sendTransactionAsyncWithWeb3Signing,
  SendTransactionLogEvent,
  SendTransactionLogEventType,
} from '@celo/walletkit'
import { StableToken } from '@celo/walletkit/types/StableToken'
import { call, delay, race, select, take } from 'redux-saga/effects'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEFAULT_FORNO_URL } from 'src/config'
import Logger from 'src/utils/Logger'
import { assertNever } from 'src/utils/typescript'
import { web3 } from 'src/web3/contracts'
import { fornoSelector } from 'src/web3/selectors'
import { TransactionObject } from 'web3/eth/types'

const TAG = 'transactions/send'
const TX_NUM_RETRIES = 3
const TX_RETRY_DELAY = 1000 // 1s
const TX_TIMEOUT = 20000 // 20s

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
  staticGas?: number
) {
  Logger.debug(`${TAG}@sendTransactionPromises`, `Going to send a transaction with id ${txId}`)
  // Use stabletoken to pay for gas by default
  const stableToken: StableToken = yield call(getStableTokenContract, web3)
  const fornoMode: boolean = yield select(fornoSelector)

  Logger.debug(`${TAG}@sendTransactionPromises`, `Sending tx ${txId} in forno mode ${fornoMode}`)
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
      getLogger(tag, txId),
      staticGas
    )
    return transactionPromises
  } else {
    Logger.debug(
      `${TAG}@sendTransactionPromises`,
      `Sending transaction with id ${txId} using geth signing`
    )
    const transactionPromises = yield call(
      sendTransactionAsync,
      tx,
      account,
      stableToken,
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
  const sendTxMethod = function*() {
    const { confirmation } = yield call(sendTransactionPromises, tx, account, tag, txId, staticGas)
    const result = yield confirmation
    return result
  }
  yield call(wrapSendTransactionWithRetry, txId, sendTxMethod, cancelAction)
}

export function* wrapSendTransactionWithRetry(
  txId: string,
  sendMethod: any,
  cancelAction?: string
) {
  for (let i = 0; i < TX_NUM_RETRIES; i++) {
    try {
      const { result, timeout, cancel } = yield race({
        result: call(sendMethod),
        timeout: delay(TX_TIMEOUT),
        ...(cancelAction && {
          cancel: take(cancelAction),
        }),
      })

      if (result === true) {
        Logger.debug(`${TAG}@wrapSendTransactionWithRetry`, `tx ${txId} result true`)
        return result
      } else if (result === false) {
        Logger.error(`${TAG}@wrapSendTransactionWithRetry`, `tx ${txId} result false`)
        throw new Error(ErrorMessages.TRANSACTION_FAILED)
      } else if (timeout) {
        Logger.error(`${TAG}@wrapSendTransactionWithRetry`, `tx ${txId} timeout`)
        throw new Error(ErrorMessages.TRANSACTION_TIMEOUT)
      } else if (cancel) {
        Logger.warn(`${TAG}@wrapSendTransactionWithRetry`, `tx ${txId} cancelled`)
        return null
      } else {
        Logger.warn(`${TAG}@wrapSendTransactionWithRetry`, `Unexpected case, no result or failure`)
      }
    } catch (err) {
      Logger.error(`${TAG}@wrapSendTransactionWithRetry`, `Tx ${txId} failed`, err)
      //TODO add check for web3 error and maybe don't retry?
      if (i + 1 < TX_NUM_RETRIES) {
        yield delay(TX_RETRY_DELAY)
        Logger.debug(`${TAG}@wrapSendTransactionWithRetry`, `Tx ${txId} retrying attempt ${i + 1}`)
      } else {
        throw err
      }
    }
  }
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
