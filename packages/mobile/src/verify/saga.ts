import { prepare, komenciContextSelector, disableKomenci } from 'src/verify/reducer'
import { Result } from '@celo/base/lib/result'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import {
  call,
  cancelled,
  put,
  select,
  spawn,
  take,
  takeEvery,
  takeLatest,
  takeLeading,
} from 'redux-saga/effects'
import { KomenciKit } from '@celo/komencikit/src/kit'
import {
  AuthenticationFailed,
  FetchError,
  InvalidWallet,
  KomenciDown,
  LoginSignatureError,
  TxError,
  WalletValidationError,
} from '@celo/komencikit/src/errors'
import {
  hasExceededKomenciErrorQuota,
  KomenciErrorQuotaExceeded,
} from 'src/identity/feelessVerificationErrors'
import networkConfig from 'src/geth/networkConfig'

const TAG = 'verify/saga'

function* fetchKomenciReadiness(komenciKit: KomenciKit, errorTimestamps: number[]) {
  const serviceStatusResult: Result<true, KomenciDown> = yield call([
    komenciKit,
    komenciKit.checkService,
  ])

  if (!serviceStatusResult.ok) {
    Logger.debug(TAG, '@fetchKomenciReadiness', 'Komenci service is down')
    throw serviceStatusResult.error
  }

  if (hasExceededKomenciErrorQuota(errorTimestamps)) {
    Logger.debug(TAG, '@fetchKomenciReadiness', 'Too  many errors')
    throw new KomenciErrorQuotaExceeded()
  }

  return true
}

function* prepareVerification(action: typeof prepare) {
  // Checking Komenci readiness
  const contractKit = yield call(getContractKit)
  const walletAddress = yield call(getConnectedUnlockedAccount)
  Logger.debug(TAG, '@prepareVerification', walletAddress)

  const komenci = yield select(komenciContextSelector)
  const komenciKit = new KomenciKit(contractKit, walletAddress, {
    url: komenci.callbackUrl || networkConfig.komenciUrl,
    token: komenci.sessionToken,
  })

  try {
    const isKomenciReady = yield call(fetchKomenciReadiness, komenciKit, komenci.errorTimestamps)
    if (!isKomenciReady) {
      yield put(disableKomenci())
    }
  } catch (e) {
    Logger.error(TAG, '@prepareVerification', e)
    if (e instanceof KomenciDown) {
      // TODO: Implement retry
    } else {
      yield put(disableKomenci())
    }
  }
}

export function* verifySaga() {
  Logger.debug(TAG, 'Initializing verify sagas')
  yield takeEvery(prepare.type, prepareVerification)
}
