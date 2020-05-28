import {
  cancelled,
  put,
  select,
  spawn,
  takeEvery,
  takeLatest,
  takeLeading,
} from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  ValidateRecipientAddressAction,
  validateRecipientAddressSuccess,
} from 'src/identity/actions'
import { doImportContactsWrapper, fetchAddressesAndValidateSaga } from 'src/identity/contactMapping'
import { e164NumberToAddressSelector } from 'src/identity/reducer'
import { validateAndReturnMatch } from 'src/identity/secureSend'
import { revokeVerification, startVerification } from 'src/identity/verification'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'identity/saga'

export function* validateRecipientAddressSaga({
  userInputOfFullAddressOrLastFourDigits,
  addressValidationType,
  recipient,
}: ValidateRecipientAddressAction) {
  Logger.debug(TAG, 'Starting Recipient Address Validation')
  try {
    if (!recipient.e164PhoneNumber) {
      throw Error(`Invalid recipient type for Secure Send: ${recipient.kind}`)
    }

    const userAddress = yield select(currentAccountSelector)
    const e164NumberToAddress = yield select(e164NumberToAddressSelector)
    const { e164PhoneNumber } = recipient
    const possibleRecievingAddresses = e164NumberToAddress[e164PhoneNumber]

    // Should never happen since secure send is initiated due to there being several possible addresses
    if (!possibleRecievingAddresses) {
      throw Error('There are no possible recipient addresses to validate against')
    }

    const validatedAddress = validateAndReturnMatch(
      userInputOfFullAddressOrLastFourDigits,
      possibleRecievingAddresses,
      userAddress,
      addressValidationType
    )
    yield put(validateRecipientAddressSuccess(e164PhoneNumber, validatedAddress))
  } catch (error) {
    Logger.error(TAG, 'validateRecipientAddressSaga/Address validation error: ', error)
    if (Object.values(ErrorMessages).includes(error.message)) {
      yield put(showError(error.message))
    } else {
      yield put(showError(ErrorMessages.ADDRESS_VALIDATION_ERROR))
    }
  }
}
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
