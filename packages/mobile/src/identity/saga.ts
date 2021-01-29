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
import { showErrorInline } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { knownAddressesChannel } from 'src/firebase/firebase'
import {
  Actions,
  FetchVerificationState,
  updateKnownAddresses,
  ValidateRecipientAddressAction,
  validateRecipientAddressSuccess,
} from 'src/identity/actions'
import { checkTxsForIdentityMetadata } from 'src/identity/commentEncryption'
import { doImportContactsWrapper, fetchAddressesAndValidateSaga } from 'src/identity/contactMapping'
import {
  feelessFetchVerificationState,
  feelessStartVerification,
} from 'src/identity/feelessVerification'
import {
  AddressToDisplayNameType,
  AddressValidationType,
  e164NumberToAddressSelector,
} from 'src/identity/reducer'
import { revokeVerificationSaga } from 'src/identity/revoke'
import { validateAndReturnMatch } from 'src/identity/secureSend'
import {
  fetchVerificationState,
  reportRevealStatusSaga,
  startVerification,
} from 'src/identity/verification'
import { recipientHasNumber } from 'src/recipients/recipient'
import { Actions as TransactionActions } from 'src/transactions/actions'
import Logger from 'src/utils/Logger'
import { fetchDataEncryptionKeyWrapper } from 'src/web3/dataEncryptionKey'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'identity/saga'

export function* validateRecipientAddressSaga({
  userInputOfFullAddressOrLastFourDigits,
  addressValidationType,
  recipient,
  requesterAddress,
}: ValidateRecipientAddressAction) {
  Logger.debug(TAG, 'Starting Recipient Address Validation')
  try {
    if (!recipientHasNumber(recipient)) {
      throw Error(`Invalid recipient type for Secure Send, does not have e164Number`)
    }

    const userAddress = yield select(currentAccountSelector)
    const e164NumberToAddress = yield select(e164NumberToAddressSelector)
    const { e164PhoneNumber } = recipient
    const possibleRecievingAddresses = e164NumberToAddress[e164PhoneNumber]

    // Should never happen - Secure Send is initiated to deal with
    // there being several possible addresses
    if (!possibleRecievingAddresses) {
      throw Error('There are no possible recipient addresses to validate against')
    }

    // E164NumberToAddress in redux store only holds verified addresses
    // Need to add the requester address to the option set in the event
    // a request is coming from an unverified account
    if (requesterAddress && !possibleRecievingAddresses.includes(requesterAddress)) {
      possibleRecievingAddresses.push(requesterAddress)
    }

    const validatedAddress = validateAndReturnMatch(
      userInputOfFullAddressOrLastFourDigits,
      possibleRecievingAddresses,
      userAddress,
      addressValidationType
    )

    ValoraAnalytics.track(SendEvents.send_secure_complete, {
      confirmByScan: false,
      partialAddressValidation: addressValidationType === AddressValidationType.PARTIAL,
    })

    yield put(validateRecipientAddressSuccess(e164PhoneNumber, validatedAddress))
  } catch (error) {
    ValoraAnalytics.track(SendEvents.send_secure_incorrect, {
      confirmByScan: false,
      partialAddressValidation: addressValidationType === AddressValidationType.PARTIAL,
      error: error.message,
    })

    Logger.error(TAG, 'validateRecipientAddressSaga/Address validation error: ', error)
    if (Object.values(ErrorMessages).includes(error.message)) {
      yield put(showErrorInline(error.message))
    } else {
      yield put(showErrorInline(ErrorMessages.ADDRESS_VALIDATION_ERROR))
    }
  }
}

function* handleFetchVerificationState(action: FetchVerificationState) {
  const { forceUnlockAccount } = action
  yield call(fetchVerificationState, forceUnlockAccount)
}

function* fetchKnownAddresses() {
  const addressesChannel = yield call(knownAddressesChannel)
  if (!addressesChannel) {
    return
  }
  try {
    while (true) {
      const addresses: AddressToDisplayNameType = yield take(addressesChannel)
      yield put(updateKnownAddresses(addresses))
    }
  } catch (error) {
    Logger.error(`${TAG}@fetchKnownAddresses`, error)
  } finally {
    if (yield cancelled()) {
      addressesChannel.close()
    }
  }
}

function* watchVerification() {
  yield takeLeading(Actions.FETCH_VERIFICATION_STATE, handleFetchVerificationState)
  yield takeLatest(Actions.FEELESS_FETCH_VERIFICATION_STATE, feelessFetchVerificationState)
  yield takeLatest(Actions.START_VERIFICATION, startVerification)
  yield takeLatest(Actions.FEELESS_START_VERIFICATION, feelessStartVerification)
  yield takeLeading(Actions.REVOKE_VERIFICATION, revokeVerificationSaga)
}

function* watchContactMapping() {
  yield takeLeading(Actions.IMPORT_CONTACTS, doImportContactsWrapper)
  yield takeEvery(Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS, fetchAddressesAndValidateSaga)
}

export function* watchValidateRecipientAddress() {
  yield takeLatest(Actions.VALIDATE_RECIPIENT_ADDRESS, validateRecipientAddressSaga)
}

function* watchNewFeedTransactions() {
  yield takeEvery(TransactionActions.NEW_TRANSACTIONS_IN_FEED, checkTxsForIdentityMetadata)
}

function* watchFetchDataEncryptionKey() {
  yield takeLeading(Actions.FETCH_DATA_ENCRYPTION_KEY, fetchDataEncryptionKeyWrapper)
}

function* watchReportRevealStatus() {
  yield takeEvery(Actions.REPORT_REVEAL_STATUS, reportRevealStatusSaga)
}

export function* identitySaga() {
  Logger.debug(TAG, 'Initializing identity sagas')
  try {
    yield spawn(watchVerification)
    yield spawn(watchContactMapping)
    yield spawn(watchValidateRecipientAddress)
    yield spawn(watchNewFeedTransactions)
    yield spawn(watchFetchDataEncryptionKey)
    yield spawn(watchReportRevealStatus)
    yield spawn(fetchKnownAddresses)
  } catch (error) {
    Logger.error(TAG, 'Error initializing identity sagas', error)
  } finally {
    if (yield cancelled()) {
      Logger.error(TAG, 'identity sagas prematurely cancelled')
    }
  }
}
