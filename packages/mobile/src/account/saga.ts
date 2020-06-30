import { put, takeLeading } from 'redux-saga/effects'
import {
  Actions,
  SetPincodeAction,
  setPincodeFailure,
  setPincodeSuccess,
} from 'src/account/actions'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Logger from 'src/utils/Logger'

const TAG = 'account/saga'

export function* setPincode({ pincodeType }: SetPincodeAction) {
  try {
    // TODO hooks into biometrics will likely go here
    // But for now this saga does not to much, most cut during the auth refactor
    yield put(setPincodeSuccess(pincodeType))
    Logger.info(TAG + '@setPincode', 'Pincode set successfully')
  } catch (error) {
    Logger.error(TAG + '@setPincode', 'Failed to set pincode', error)
    CeloAnalytics.track(CustomEventNames.pin_failed_to_set, { error, pincodeType })
    yield put(showError(ErrorMessages.SET_PIN_FAILED))
    yield put(setPincodeFailure())
  }
}

export function* accountSaga() {
  yield takeLeading(Actions.SET_PINCODE, setPincode)
}
