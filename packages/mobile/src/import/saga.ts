import { mnemonicToSeedHex } from 'react-native-bip39'
import { call, put, spawn, takeLeading } from 'redux-saga/effects'
import { setBackupCompleted } from 'src/account'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { refreshAllBalances } from 'src/home/actions'
import { Actions, ImportBackupPhraseAction } from 'src/import/actions'
import { redeemInviteSuccess } from 'src/invite/actions'
import { navigateReset } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { setKey } from 'src/utils/keyStore'
import { assignAccountFromPrivateKey } from 'src/web3/saga'

export function* importBackupPhraseSaga(action: ImportBackupPhraseAction) {
  const { phrase } = action
  const privateKey = mnemonicToSeedHex(phrase)
  const account = yield call(assignAccountFromPrivateKey, privateKey)
  if (account) {
    yield call(setKey, 'mnemonic', phrase)
    // Set backup complete so user isn't prompted to do backup flow
    yield put(setBackupCompleted())
    // Set redeem invite complete so user isn't brought back into nux flow
    yield put(redeemInviteSuccess())
    yield put(refreshAllBalances())
    navigateReset(Screens.ImportContacts)
  } else {
    yield put(showError(ErrorMessages.IMPORT_BACKUP_FAILED))
  }
}

export function* watchImportBackupPhrase() {
  yield takeLeading(Actions.IMPORT_BACKUP_PHRASE, importBackupPhraseSaga)
}

export function* importSaga() {
  yield spawn(watchImportBackupPhrase)
}
