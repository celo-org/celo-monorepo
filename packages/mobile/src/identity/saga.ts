import { cancelled, spawn, takeEvery, takeLeading } from 'redux-saga/effects'
import { Actions } from 'src/identity/actions'
import { doImportContacts, fetchPhoneAddresses } from 'src/identity/contactMapping'
import { revokeVerification, startVerification } from 'src/identity/verification'
import Logger from 'src/utils/Logger'

const TAG = 'identity/saga'

function* watchVerification() {
  yield takeLeading(Actions.START_VERIFICATION, startVerification)
  yield takeEvery(Actions.REVOKE_VERIFICATION, revokeVerification)
}

function* watchContactMapping() {
  yield takeEvery(Actions.IMPORT_CONTACTS, doImportContacts)
  yield takeEvery(Actions.FETCH_PHONE_ADDRESSES, fetchPhoneAddresses)
}

export function* abeSaga() {
  Logger.debug(TAG, 'Initializing ABE sagas')
  try {
    yield spawn(watchVerification)
    yield spawn(watchContactMapping)
    yield spawn(doImportContacts)
  } catch (error) {
    Logger.error(TAG, 'Error initializing ABE sagas', error)
  } finally {
    if (yield cancelled()) {
      Logger.error(TAG, 'ABE sagas prematurely cancelled')
    }
  }
}
