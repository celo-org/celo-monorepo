import { ContractKit } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { CURRENCY_ENUM } from '@celo/utils'
import firebase from '@react-native-firebase/app'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, take, takeLeading } from 'redux-saga/effects'
import {
  Actions,
  ClearStoredAccountAction,
  SetPincodeAction,
  setPincodeFailure,
  setPincodeSuccess,
} from 'src/account/actions'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { clearStoredMnemonic, getStoredMnemonic } from 'src/backup/utils'
import { FIREBASE_ENABLED } from 'src/config'
import { firebaseSignOut } from 'src/firebase/firebase'
import { deleteNodeData } from 'src/geth/geth'
import { revokeVerificationSaga } from 'src/identity/revoke'
import { Actions as ImportActions } from 'src/import/actions'
import { importBackupPhraseSaga } from 'src/import/saga'
import { moveAllFundsFromAccount } from 'src/invite/saga'
import { removeAccountLocally } from 'src/pincode/authentication'
import { persistor } from 'src/redux/store'
import { restartApp } from 'src/utils/AppRestart'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'account/saga'

export const SENTINEL_MIGRATE_COMMENT = '__CELO_MIGRATE_TX__'

export function* setPincode({ pincodeType }: SetPincodeAction) {
  try {
    // TODO hooks into biometrics will likely go here
    // But for now this saga does not to much, most cut during the auth refactor
    yield put(setPincodeSuccess(pincodeType))
    Logger.info(TAG + '@setPincode', 'Pincode set successfully')
  } catch (error) {
    Logger.error(TAG + '@setPincode', 'Failed to set pincode', error)
    ValoraAnalytics.track(OnboardingEvents.pin_failed_to_set, { error: error.message, pincodeType })
    yield put(showError(ErrorMessages.SET_PIN_FAILED))
    yield put(setPincodeFailure())
  }
}

function* migrateAccountToProperBip39() {
  const account: string | null = yield select(currentAccountSelector)
  const e164Number: string | null = yield select(e164NumberSelector)
  if (!account) {
    throw new Error('account not set')
  }
  if (!e164Number) {
    throw new Error('e164 number not set')
  }

  yield call(getConnectedUnlockedAccount)
  yield call(revokeVerificationSaga)

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
      moveAllFundsFromAccount,
      account,
      goldTokenBalance,
      newAccount,
      CURRENCY_ENUM.GOLD,
      SENTINEL_MIGRATE_COMMENT
    )
  }
  const stableTokenBalance: BigNumber = yield call([stableToken, stableToken.balanceOf], account)
  if (stableTokenBalance.isGreaterThan(0)) {
    yield call(
      moveAllFundsFromAccount,
      account,
      stableTokenBalance,
      newAccount,
      CURRENCY_ENUM.DOLLAR,
      SENTINEL_MIGRATE_COMMENT
    )
  }
}

function* clearStoredAccountSaga({ account }: ClearStoredAccountAction) {
  try {
    yield call(removeAccountLocally, account)
    yield call(clearStoredMnemonic)
    yield call(ValoraAnalytics.reset)
    yield call(deleteNodeData)

    // Ignore error if it was caused by Firebase.
    try {
      yield call(firebaseSignOut, firebase.app())
    } catch (error) {
      if (FIREBASE_ENABLED) {
        Logger.error(TAG + '@clearStoredAccount', 'Failed to sign out from Firebase', error)
      }
    }

    yield call(persistor.flush)
    yield call(restartApp)
  } catch (error) {
    Logger.error(TAG + '@clearStoredAccount', 'Error while removing account', error)
    yield put(showError(ErrorMessages.ACCOUNT_CLEAR_FAILED))
  }
}

export function* watchMigrateAccountToProperBip39() {
  yield take(Actions.MIGRATE_ACCOUNT_BIP39)
  yield call(migrateAccountToProperBip39)
}

export function* watchSetPincode() {
  yield takeLeading(Actions.SET_PINCODE, setPincode)
}

export function* watchClearStoredAccount() {
  const action = yield take(Actions.CLEAR_STORED_ACCOUNT)
  yield call(clearStoredAccountSaga, action)
}

export function* accountSaga() {
  yield spawn(watchMigrateAccountToProperBip39)
  yield spawn(watchSetPincode)
  yield spawn(watchClearStoredAccount)
}
