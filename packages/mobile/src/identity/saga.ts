import { cancelled, spawn, takeEvery, takeLatest, takeLeading } from 'redux-saga/effects'
import { Actions } from 'src/identity/actions'
import { doImportContactsWrapper, fetchPhoneAddresses } from 'src/identity/contactMapping'
import { revokeVerification, startVerification } from 'src/identity/verification'
import Logger from 'src/utils/Logger'

const TAG = 'identity/saga'

function* watchVerification() {
  yield takeLatest(Actions.START_VERIFICATION, startVerification)
  yield takeEvery(Actions.REVOKE_VERIFICATION, revokeVerification)
}

function* watchContactMapping() {
  yield takeLeading(Actions.IMPORT_CONTACTS, doImportContactsWrapper)
  yield takeEvery(Actions.FETCH_PHONE_ADDRESSES, fetchPhoneAddresses)
}

export function* identitySaga() {
  Logger.debug(TAG, 'Initializing identity sagas')
  try {
    yield spawn(watchVerification)
    yield spawn(watchContactMapping)
  } catch (error) {
    Logger.error(TAG, 'Error initializing identity sagas', error)
  } finally {
    if (yield cancelled()) {
      Logger.error(TAG, 'identity sagas prematurely cancelled')
    }
  }
}
