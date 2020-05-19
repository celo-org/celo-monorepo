import { cancelled, spawn, takeEvery, takeLatest, takeLeading } from 'redux-saga/effects'
import { Actions } from 'src/identity/actions'
import { doImportContactsWrapper, fetchAddressesAndValidateSaga } from 'src/identity/contactMapping'
import { revokeVerification, startVerification } from 'src/identity/verification'
import { validateRecipientAddressSaga } from 'src/send/saga'
import Logger from 'src/utils/Logger'

const TAG = 'identity/saga'

function* watchVerification() {
  yield takeLatest(Actions.START_VERIFICATION, startVerification)
  yield takeEvery(Actions.REVOKE_VERIFICATION, revokeVerification)
}

function* watchContactMapping() {
  yield takeLeading(Actions.IMPORT_CONTACTS, doImportContactsWrapper)
  yield takeEvery(Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS, fetchAddressesAndValidateSaga)
}

export function* watchValidateRecipientAddress() {
  yield takeLatest(Actions.VALIDATE_RECIPIENT_ADDRESS, validateRecipientAddressSaga)
}

export function* identitySaga() {
  Logger.debug(TAG, 'Initializing identity sagas')
  try {
    yield spawn(watchVerification)
    yield spawn(watchContactMapping)
    yield spawn(watchValidateRecipientAddress)
  } catch (error) {
    Logger.error(TAG, 'Error initializing identity sagas', error)
  } finally {
    if (yield cancelled()) {
      Logger.error(TAG, 'identity sagas prematurely cancelled')
    }
  }
}
