import { AnyAction } from 'redux'
import { call, select, spawn, takeEvery } from 'redux-saga/effects'
import { devModeSelector } from 'src/account/reducer'
import { appSaga, waitForRehydrate } from 'src/app/saga'
import { escrowSaga } from 'src/escrow/saga'
import { exchangeSaga } from 'src/exchange/saga'
import { firebaseSaga } from 'src/firebase/saga'
import { gethSaga } from 'src/geth/saga'
import { goldTokenSaga } from 'src/goldToken/saga'
import { homeSaga } from 'src/home/saga'
import { abeSaga } from 'src/identity/saga'
import { importSaga } from 'src/import/saga'
import { inviteSaga } from 'src/invite/saga'
import { networkInfoSaga } from 'src/networkInfo/saga'
import { sendSaga } from 'src/send/saga'
import { stableTokenSaga } from 'src/stableToken/saga'
import Logger from 'src/utils/Logger'
import { web3Saga } from 'src/web3/saga'

const loggerBlacklist = [
  'persist/REHYDRATE',
  'GETH_NEW_BLOCK',
  'APP/SET_GETH_CONNECTED',
  'ACCOUNT/SET_PHONE_NUMBER',
  'SEND/SET_RECIPIENT_CACHE',
  'IMPORT/IMPORT_BACKUP_PHRASE',
  'WEB3/SET_COMMENT_KEY',
  'IDENTITY/UPDATE_E164_PHONE_NUMBER_ADDRESSES',
  'IDENTITY/FETCH_PHONE_ADDRESSES',
]

function* loggerSaga() {
  yield call(waitForRehydrate)
  const devModeActive = yield select(devModeSelector)
  if (!devModeActive) {
    return
  }

  yield takeEvery('*', (action: AnyAction) => {
    if (action && action.type && loggerBlacklist.includes(action.type)) {
      return
    }
    try {
      Logger.debug('redux/saga@logger', JSON.stringify(action))
    } catch (err) {
      Logger.warn('redux/saga@logger', 'could not log action of type', action.type)
    }
  })
}

export function* rootSaga() {
  yield spawn(loggerSaga)
  yield spawn(appSaga)
  yield spawn(networkInfoSaga)
  yield spawn(gethSaga)
  yield spawn(web3Saga)
  yield spawn(abeSaga)
  yield spawn(goldTokenSaga)
  yield spawn(stableTokenSaga)
  yield spawn(sendSaga)
  yield spawn(exchangeSaga)
  yield spawn(homeSaga)
  yield spawn(escrowSaga)
  yield spawn(firebaseSaga)
  yield spawn(inviteSaga)
  yield spawn(importSaga)
}
