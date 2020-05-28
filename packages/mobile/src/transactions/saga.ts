import { CeloTransactionObject } from '@celo/contractkit'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { eventChannel, EventChannel } from 'redux-saga'
import { call, put, select, spawn, take } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { apolloClient } from 'src/apollo'
import { Token, TransactionFeedFragment, UserTransactionsQuery } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { fetchGoldBalance } from 'src/goldToken/actions'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { fetchDollarBalance } from 'src/stableToken/actions'
import {
  Actions,
  addHashToStandbyTransaction,
  newTransactionsInFeed,
  removeStandbyTransaction,
  transactionConfirmed,
  transactionFailed,
} from 'src/transactions/actions'
import { TxPromises } from 'src/transactions/contract-utils'
import {
  knownFeedTransactionsSelector,
  KnownFeedTransactionsType,
  standbyTransactionsSelector,
} from 'src/transactions/reducer'
import { sendTransactionPromises, wrapSendTransactionWithRetry } from 'src/transactions/send'
import { getTxsFromUserTxQuery } from 'src/transactions/transferFeedUtils'
import { StandbyTransaction, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getAccount } from 'src/web3/saga'

const TAG = 'transactions/saga'

interface UserTxQueryChannelEvent {
  transactionFeedFragments: TransactionFeedFragment[]
}

export function* initializeUserTxListQueryWatcher() {
  const address: string | null = yield call(getAccount)
  const localCurrencyCode = yield select(getLocalCurrencyCode)
  const token = Token.CUsd

  // Using a dynamic require import here because of an import cycle around TransactionsList that is
  // causing many tests to fail. Alternative is to mock this entire saga file or significantly restructure things.
  const query = require('src/transactions/TransactionsList').TRANSACTIONS_QUERY

  const userTxQueryChannel: EventChannel<UserTxQueryChannelEvent> = eventChannel((emitter) => {
    const querySubscription = apolloClient
      .watchQuery<UserTransactionsQuery | undefined>({
        query,
        variables: {
          address,
          token,
          localCurrencyCode,
        },
        fetchPolicy: 'cache-and-network',
      })
      .subscribe({
        next: (queryResult) => {
          if (queryResult.loading) {
            return
          }

          if (queryResult.errors) {
            Logger.error(TAG, 'Error watching user tx query' + JSON.stringify(queryResult.errors))
            return
          }
          emitter({
            transactionFeedFragments: getTxsFromUserTxQuery(queryResult.data),
          })
        },
        error: (e) => console.error(e),
      })

    return querySubscription.unsubscribe
  })
  yield spawn(watchUserTxQueryChannel, userTxQueryChannel)
}

function* watchUserTxQueryChannel(channel: EventChannel<UserTxQueryChannelEvent>) {
  try {
    Logger.debug(`${TAG}/watchUserTransactionQueryChannel`, 'Started channel watching')
    while (true) {
      const event: UserTxQueryChannelEvent = yield take(channel)
      if (!event) {
        Logger.debug(`${TAG}/watchUserTransactionQueryChannel`, 'Data in channel was empty')
        continue
      }
      Logger.info(`${TAG}/watchUserTransactionQueryChannel`, 'Notification received in the channel')
      const knownTxs: KnownFeedTransactionsType = yield select(knownFeedTransactionsSelector)
      const newTxs = event.transactionFeedFragments.filter((tx) => !knownTxs[tx.hash])
      if (!newTxs.length) {
        continue
      }
      yield put(newTransactionsInFeed(newTxs))
      yield call(cleanupStandbyTransactions, newTxs)
    }
  } catch (error) {
    Logger.error(
      `${TAG}/watchUserTransactionQueryChannel`,
      'Error proccesing user tx query channel event',
      error
    )
  } finally {
    Logger.debug(`${TAG}/watchUserTransactionQueryChannel`, 'User tx channel terminated')
  }
}

// Remove standby txs from redux state when the real ones show up in the feed
function* cleanupStandbyTransactions(newFeedTransactions: TransactionFeedFragment[]) {
  const standbyTxs: StandbyTransaction[] = yield select(standbyTransactionsSelector)
  const newFeedTxHashes = new Set(newFeedTransactions.map((tx) => tx?.hash))
  for (const standbyTx of standbyTxs) {
    if (
      standbyTx.hash &&
      standbyTx.status !== TransactionStatus.Failed &&
      newFeedTxHashes.has(standbyTx.hash)
    ) {
      yield put(removeStandbyTransaction(standbyTx.id))
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
