import { randomBytes } from 'react-native-randombytes'
import { call, put, takeLeading } from 'redux-saga/effects'
import {
  Actions,
  SetPincodeAction,
  setPincodeFailure,
  setPincodeSuccess,
} from 'src/account/actions'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
// @ts-ignore TS doesn't understand the RN's platform specific file imports
import { setPin } from 'src/pincode/PincodeUtils'
import Logger from 'src/utils/Logger'

const TAG = 'account/saga'

export function* setPincode({ useSystemAuth }: SetPincodeAction) {
  try {
    if (useSystemAuth) {
      Logger.debug(TAG + '@setPincode', `Setting pincode with using system auth`)
      const pin = randomBytes(10).toString('hex')
      yield call(setPin, pin)
    } else {
      Logger.debug(TAG + '@setPincode', `Pincode set using user provided pin`)
    }

    yield put(setPincodeSuccess())
    Logger.info(TAG + '@setPincode', 'Pincode set successfully')
  } catch (error) {
    Logger.error(TAG + '@setPincode', 'Failed to set pincode', error)
    yield put(showError(ErrorMessages.SET_PIN_FAILED))
    yield put(setPincodeFailure())
  }
}

export function* accountSaga() {
  yield takeLeading(Actions.SET_PINCODE, setPincode)
}
