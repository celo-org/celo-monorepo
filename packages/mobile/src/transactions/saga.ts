import { CeloTransactionObject } from '@celo/contractkit'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { call, put, select, spawn, take, takeEvery } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { fetchGoldBalance } from 'src/goldToken/actions'
import { addressToE164NumberSelector } from 'src/identity/reducer'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { fetchDollarBalance } from 'src/stableToken/actions'
import {
  Actions,
  addHashToStandbyTransaction,
  addToRecentTxRecipientsCache,
  NewTransactionsInFeedAction,
  removeStandbyTransaction,
  transactionConfirmed,
  transactionFailed,
} from 'src/transactions/actions'
import { TxPromises } from 'src/transactions/contract-utils'
import { standbyTransactionsSelector } from 'src/transactions/reducer'
import { sendTransactionPromises, wrapSendTransactionWithRetry } from 'src/transactions/send'
import { isTransferTransaction } from 'src/transactions/transferFeedUtils'
import { StandbyTransaction, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'

const TAG = 'transactions/saga'

function* watchNewFeedTransactions() {
  yield takeEvery(Actions.NEW_TRANSACTIONS_IN_FEED, cleanupStandbyTransactions)
}

// Remove standby txs from redux state when the real ones show up in the feed
function* cleanupStandbyTransactions({ transactions }: NewTransactionsInFeedAction) {
  const standbyTxs: StandbyTransaction[] = yield select(standbyTransactionsSelector)
  const addressToE164Number = yield select(addressToE164NumberSelector)
  const recipientCache = yield select(recipientCacheSelector)

  const newFeedTxHashes = new Set()
  const newFeedTxAddresses: string[] = []

  transactions.forEach((tx) => {
    newFeedTxHashes.add(tx?.hash)
    if (isTransferTransaction(tx)) {
      newFeedTxAddresses.push(tx?.address)
    }
  })
  // const newFeedTxAddresses = new Set(transactions.map((tx) => tx?.hash))
  for (const standbyTx of standbyTxs) {
    if (
      standbyTx.hash &&
      standbyTx.status !== TransactionStatus.Failed &&
      newFeedTxHashes.has(standbyTx.hash)
    ) {
      yield put(removeStandbyTransaction(standbyTx.id))
    }
  }

  for (const address of newFeedTxAddresses) {
    const e164PhoneNumber = addressToE164Number[address]
    const cachedRecipient = recipientCache[e164PhoneNumber]
    if (e164PhoneNumber && cachedRecipient) {
      yield put(addToRecentTxRecipientsCache(e164PhoneNumber, cachedRecipient))
    }
  }
}

export function* waitForTransactionWithId(txId: string) {
  while (true) {
    const action = yield take([Actions.TRANSACTION_CONFIRMED, Actions.TRANSACTION_FAILED])
    if (action.txId === txId) {
      // Return true for success, false otherwise
      return action.type === Actions.TRANSACTION_CONFIRMED
    }
  }
}

export function* sendAndMonitorTransaction<T>(
  txId: string,
  tx: CeloTransactionObject<T>,
  account: string,
  currency?: CURRENCY_ENUM
) {
  try {
    Logger.debug(TAG + '@sendAndMonitorTransaction', `Sending transaction with id: ${txId}`)

    const sendTxMethod = function*(nonce?: number) {
      const { transactionHash, confirmation }: TxPromises = yield call(
        sendTransactionPromises,
        tx.txo,
        account,
        TAG,
        txId,
        nonce
      )
      const hash = yield transactionHash
      yield put(addHashToStandbyTransaction(txId, hash))
      const result = yield confirmation
      return result
    }
    yield call(wrapSendTransactionWithRetry, txId, sendTxMethod)
    yield put(transactionConfirmed(txId))

    if (currency === CURRENCY_ENUM.GOLD) {
      yield put(fetchGoldBalance())
    } else if (currency === CURRENCY_ENUM.DOLLAR) {
      CeloAnalytics.track(CustomEventNames.send_dollar_transaction_confirmed)
      yield put(fetchDollarBalance())
    } else {
      // Fetch both balances for exchange
      yield put(fetchGoldBalance())
      yield put(fetchDollarBalance())
    }
  } catch (error) {
    Logger.error(TAG + '@sendAndMonitorTransaction', `Error sending tx ${txId}`, error)
    yield put(removeStandbyTransaction(txId))
    yield put(transactionFailed(txId))
    yield put(showError(ErrorMessages.TRANSACTION_FAILED))
  }
}

export function* transactionSaga() {
  yield spawn(watchNewFeedTransactions)
}
