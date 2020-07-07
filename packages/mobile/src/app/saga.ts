import { ContractKit } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { CURRENCY_ENUM } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { AppState, Linking } from 'react-native'
import { REHYDRATE } from 'redux-persist/es/constants'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  Actions,
  appLock,
  OpenDeepLink,
  SetAppState,
  setAppState,
  setLanguage,
} from 'src/app/actions'
import { currentLanguageSelector } from 'src/app/reducers'
import { getLastTimeBackgrounded, getRequirePinOnAppOpen } from 'src/app/selectors'
import { getStoredMnemonic } from 'src/backup/utils'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { isAppVersionDeprecated } from 'src/firebase/firebase'
import { receiveAttestationMessage } from 'src/identity/actions'
import { revokePhoneMapping } from 'src/identity/revoke'
import { CodeInputType } from 'src/identity/verification'
import { Actions as ImportActions } from 'src/import/actions'
import { importBackupPhraseSaga } from 'src/import/saga'
import { withdrawFundsFromTempAccount } from 'src/invite/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { clockInSync } from 'src/utils/time'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { parse } from 'url'

const TAG = 'app/saga'

// There are cases, when user will put the app into `background` state,
// but we do not want to lock it immeditely. Here are some examples:
// case 1: User switches to SMS app to copy verification text
// case 2: User gets a permission request dialog
//    (which will put an app into `background` state until dialog disappears).
const DO_NOT_LOCK_PERIOD = 30000 // 30 sec

export function* waitForRehydrate() {
  const rehydrated = yield select((state: RootState) => state.networkInfo.rehydrated)
  if (rehydrated) {
    return
  }
  yield take(REHYDRATE)
  return
}

export function* watchRehydrate() {
  yield take(REHYDRATE)

  const isDeprecated: boolean = yield call(isAppVersionDeprecated)

  if (isDeprecated) {
    Logger.warn(TAG, 'App version is deprecated')
    navigate(Screens.UpgradeScreen)
    return
  } else {
    Logger.debug(TAG, 'App version is valid')
  }

  const language = yield select(currentLanguageSelector)
  if (language) {
    yield put(setLanguage(language))
  }

  const deepLink = yield call(Linking.getInitialURL)
  const inSync = yield call(clockInSync)
  if (!inSync) {
    navigate(Screens.SetClock)
    return
  }

  if (deepLink) {
    handleDeepLink(deepLink)
    return
  }
}

export function* handleDeepLink(action: OpenDeepLink) {
  const { deepLink } = action
  Logger.debug(TAG, 'Handling deep link', deepLink)
  const rawParams = parse(deepLink, true)
  if (rawParams.path) {
    if (rawParams.path.startsWith('/v/')) {
      yield put(receiveAttestationMessage(rawParams.path.substr(3), CodeInputType.DEEP_LINK))
    }

    if (rawParams.path.startsWith('/dappkit')) {
      handleDappkitDeepLink(deepLink)
    }
  }
}

export function* watchDeepLinks() {
  yield takeLatest(Actions.OPEN_DEEP_LINK, handleDeepLink)
}

function createAppStateChannel() {
  return eventChannel((emit: any) => {
    AppState.addEventListener('change', emit)

    const removeEventListener = () => {
      AppState.removeEventListener('change', emit)
    }
    return removeEventListener
  })
}

function* watchAppState() {
  Logger.debug(`${TAG}@monitorAppState`, 'Starting monitor app state saga')
  const appStateChannel = yield createAppStateChannel()
  while (true) {
    try {
      const newState = yield take(appStateChannel)
      Logger.debug(`${TAG}@monitorAppState`, `App changed state: ${newState}`)
      yield put(setAppState(newState))
    } catch (error) {
      ValoraAnalytics.track(AppEvents.app_state_error, { error: error.message })
      Logger.error(`${TAG}@monitorAppState`, `App state Error`, error)
    } finally {
      if (yield cancelled()) {
        appStateChannel.close()
      }
    }
  }
}

export function* handleSetAppState(action: SetAppState) {
  const requirePinOnAppOpen = yield select(getRequirePinOnAppOpen)
  const lastTimeBackgrounded = yield select(getLastTimeBackgrounded)
  const isPassedDoNotLockPeriod = Date.now() - lastTimeBackgrounded > DO_NOT_LOCK_PERIOD
  const isAppActive = action.state === 'active'

  if (requirePinOnAppOpen && isPassedDoNotLockPeriod && isAppActive) {
    yield put(appLock())
  }
}

function* migrateAccountToProperBip39() {
  const account: string | null = yield select(currentAccountSelector)
  const e164Number: string | null = yield select(e164NumberSelector)
  if (!account) {
    throw new Error('account not set')
  }
  if (!e164Number) {
    throw new Error('e164 numbrer not sset')
  }

  yield call(getConnectedUnlockedAccount)
  yield call(revokePhoneMapping, e164Number, account)

  const mnemonic = yield call(getStoredMnemonic, account)
  yield call(importBackupPhraseSaga, {
    type: ImportActions.IMPORT_BACKUP_PHRASE,
    phrase: mnemonic,
    useEmptyWallet: true,
  })

  const newAccount = yield select(currentAccountSelector)
  const contractKit: ContractKit = yield call(getContractKit)
  const goldToken: GoldTokenWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getGoldToken,
  ])
  const stableToken: StableTokenWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getStableToken,
  ])
  const goldTokenBalance: BigNumber = yield call([goldToken, goldToken.balanceOf], account)
  if (goldTokenBalance.isGreaterThan(0)) {
    yield call(
      withdrawFundsFromTempAccount,
      account,
      goldTokenBalance,
      newAccount,
      CURRENCY_ENUM.GOLD
    )
  }
  const stableTokenBalance: BigNumber = yield call([stableToken, stableToken.balanceOf], account)
  if (stableTokenBalance.isGreaterThan(0)) {
    yield call(
      withdrawFundsFromTempAccount,
      account,
      stableTokenBalance,
      newAccount,
      CURRENCY_ENUM.DOLLAR
    )
  }
}

export function* watchMigrateAccountToProperBip39() {
  yield takeLatest(Actions.MIGRATE_ACCOUNT_BIP39, migrateAccountToProperBip39)
}

export function* appSaga() {
  yield spawn(watchRehydrate)
  yield spawn(watchDeepLinks)
  yield spawn(watchAppState)
  yield spawn(watchMigrateAccountToProperBip39)
  yield takeLatest(Actions.SET_APP_STATE, handleSetAppState)
}
