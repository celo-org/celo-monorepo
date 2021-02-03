import { sleep } from '@celo/utils/src/async'
import firebase from '@react-native-firebase/app'
import { FirebaseDatabaseTypes } from '@react-native-firebase/database'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, select, spawn, take, takeEvery } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { Actions as AppActions, SetLanguage } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { FIREBASE_ENABLED } from 'src/config'
import { updateCeloGoldExchangeRateHistory } from 'src/exchange/actions'
import { exchangeHistorySelector, ExchangeRate, MAX_HISTORY_RETENTION } from 'src/exchange/reducer'
import { Actions, firebaseAuthorized } from 'src/firebase/actions'
import { initializeAuth, initializeCloudMessaging, setUserLanguage } from 'src/firebase/firebase'
import Logger from 'src/utils/Logger'
import { getRemoteTime } from 'src/utils/time'
import { getAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'firebase/saga'
const EXCHANGE_RATES = 'exchangeRates'
const VALUE_CHANGE_HOOK = 'value'
const FIREBASE_CONNECT_RETRIES = 3

let firebaseAlreadyAuthorized = false
export function* waitForFirebaseAuth() {
  if (firebaseAlreadyAuthorized) {
    return
  }
  yield take(Actions.AUTHORIZED)
  firebaseAlreadyAuthorized = true
  return
}

function* initializeFirebase() {
  const address = yield call(getAccount)
  if (!FIREBASE_ENABLED) {
    Logger.info(TAG, 'Firebase disabled')
    yield put(showError(ErrorMessages.FIREBASE_DISABLED))
    return
  }

  Logger.info(TAG, 'Firebase enabled')
  try {
    for (let i = 0; i < FIREBASE_CONNECT_RETRIES; i += 1) {
      try {
        const app = firebase.app()
        Logger.info(TAG, `Attempt ${i + 1} to initialize db ${app.options.databaseURL}`)

        yield call(initializeAuth, firebase, address)
        yield put(firebaseAuthorized())
        yield call(initializeCloudMessaging, firebase, address)
        Logger.info(TAG, `Firebase initialized`)

        return
      } catch (error) {
        if (i + 1 === FIREBASE_CONNECT_RETRIES) {
          throw error
        }

        yield sleep(2 ** i * 5000)
      }
    }
  } catch (error) {
    Logger.error(TAG, 'Error while initializing firebase', error)
    yield put(showError(ErrorMessages.FIREBASE_FAILED))
  }
}
export function* syncLanguageSelection({ language }: SetLanguage) {
  yield call(waitForFirebaseAuth)
  const address = yield select(currentAccountSelector)
  try {
    yield call(setUserLanguage, address, language)
  } catch (error) {
    Logger.error(TAG, 'Syncing language selection to Firebase failed', error)
  }
}

export function* watchLanguage() {
  yield takeEvery(AppActions.SET_LANGUAGE, syncLanguageSelection)
}

function celoGoldExchangeRateHistoryChannel(lastTimeUpdated: number) {
  const errorCallback = (error: Error) => {
    Logger.warn(TAG, error.toString())
  }

  const now = Date.now()

  return eventChannel((emit: any) => {
    const emitter = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      const result: ExchangeRate[] = []
      snapshot.forEach((childSnapshot: FirebaseDatabaseTypes.DataSnapshot) => {
        result.push(childSnapshot.val())
        return false
      })
      emit(result)
    }

    // timestamp + 1 is used because .startAt is inclusive
    const startAt = lastTimeUpdated + 1 || now - MAX_HISTORY_RETENTION

    const cancel = () => {
      firebase
        .database()
        .ref(`${EXCHANGE_RATES}/cGLD/cUSD`)
        .orderByChild('timestamp')
        .startAt(startAt)
        .off(VALUE_CHANGE_HOOK, emitter)
    }

    firebase
      .database()
      .ref(`${EXCHANGE_RATES}/cGLD/cUSD`)
      .orderByChild('timestamp')
      .startAt(startAt)
      .on(VALUE_CHANGE_HOOK, emitter, errorCallback)
    return cancel
  })
}

export function* subscribeToCeloGoldExchangeRateHistory() {
  yield call(waitForFirebaseAuth)
  const history = yield select(exchangeHistorySelector)
  const chan = yield call(celoGoldExchangeRateHistoryChannel, history.lastTimeUpdated)
  try {
    while (true) {
      const exchangeRates = yield take(chan)
      const now = getRemoteTime()
      yield put(updateCeloGoldExchangeRateHistory(exchangeRates, now))
    }
  } catch (error) {
    Logger.error(`${TAG}@subscribeToCeloGoldExchangeRateHistory`, error)
  } finally {
    if (yield cancelled()) {
      chan.close()
    }
  }
}

export function* firebaseSaga() {
  yield spawn(initializeFirebase)
  yield spawn(watchLanguage)
  yield spawn(subscribeToCeloGoldExchangeRateHistory)
}
