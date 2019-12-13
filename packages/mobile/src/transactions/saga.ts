import { call, put, take } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { fetchGoldBalance } from 'src/goldToken/actions'
import { fetchDollarBalance } from 'src/stableToken/actions'
import {
  Actions,
  addHashToStandbyTransaction,
  removeStandbyTransaction,
  transactionConfirmed,
} from 'src/transactions/actions'
import { sendTransactionPromises } from 'src/transactions/send'
import Logger from 'src/utils/Logger'

const TAG = 'transactions/saga'

export function* waitForTransactionWithId(txId: string) {
  while (true) {
    const action = yield take(Actions.TRANSACTION_CONFIRMED)
    if (action.txId === txId) {
      return
    }
  }
}

function* onSendAndMonitorTransactionError(txId: string) {
  yield put(removeStandbyTransaction(txId))
  yield put(showError(ErrorMessages.TRANSACTION_FAILED))
}

export function* sendAndMonitorTransaction(
  txId: string,
  tx: any,
  account: string,
  currency?: CURRENCY_ENUM
) {
  try {
    Logger.debug(TAG + '@sendAndMonitorTransaction', `Sending transaction with id: ${txId}`)

    const { transactionHash, confirmation } = yield call(
      sendTransactionPromises,
      tx,
      account,
      TAG,
      txId
    )
    Logger.debug(TAG + '@sendAndMonitorTransaction', `Got tx promises for tx ${tx}`)

    const hash = yield transactionHash
    Logger.debug(TAG + '@sendAndMonitorTransaction', `Got hash: ${hash}`)
    yield put(addHashToStandbyTransaction(txId, hash))

    yield confirmation
    Logger.debug(
      TAG + '@sendAndMonitorTransaction',
      `Yielded confirmation ${confirmation} for ${txId}`
    )
    yield put(transactionConfirmed(txId))
    Logger.debug(TAG + '@sendAndMonitorTransaction', `Confirmed transaction ${txId}`) // Gets here but still says confirming

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
    yield call(onSendAndMonitorTransactionError, txId)
    Logger.error(
      TAG + '@sendAndMonitorTransaction',
      `Transaction caught: ${txId} Error: ${JSON.stringify(error.message)}`
    )
  }
}
