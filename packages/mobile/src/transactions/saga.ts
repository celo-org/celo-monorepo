import { CeloTransactionObject } from '@celo/contractkit'
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
import { TxPromises } from 'src/transactions/contract-utils'
import { sendTransactionPromises, wrapSendTransactionWithRetry } from 'src/transactions/send'
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

export function* sendAndMonitorTransaction<T>(
  txId: string,
  tx: CeloTransactionObject<T>,
  account: string,
  currency?: CURRENCY_ENUM
) {
  var txTime = Date.now()
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

    txTime = Date.now() - txTime
    if (currency === CURRENCY_ENUM.GOLD) {
      Logger.debug(
        TAG + '@sendAndMonitorTransaction',
        `send_gold_transaction_confirmed Performance (ms) = ` + txTime.toString()
      )
      CeloAnalytics.track(CustomEventNames.send_gold_transaction_confirmed, { txTime })
      yield put(fetchGoldBalance())
    } else if (currency === CURRENCY_ENUM.DOLLAR) {
      Logger.debug(
        TAG + '@sendAndMonitorTransaction',
        `send_dollar_transaction_confirmed Performance (ms) = ` + txTime.toString()
      )
      CeloAnalytics.track(CustomEventNames.send_dollar_transaction_confirmed, { txTime })
      yield put(fetchDollarBalance())
    } else {
      // Fetch both balances for exchange
      yield put(fetchGoldBalance())
      yield put(fetchDollarBalance())
    }
    CeloAnalytics.track(CustomEventNames.send_transaction_confirmed, { txTime })
  } catch (error) {
    Logger.error(TAG + '@sendAndMonitorTransaction', `Error sending tx ${txId}`, error)
    txTime = Date.now() - txTime
    CeloAnalytics.track(CustomEventNames.send_transaction_failed, { txTime })
    yield put(removeStandbyTransaction(txId))
    yield put(showError(ErrorMessages.TRANSACTION_FAILED))
  }
}
