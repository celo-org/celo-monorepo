import { randomBytes } from 'react-native-randombytes'
import { call, put, select, takeLeading } from 'redux-saga/effects'
import {
  Actions,
  SetPincodeAction,
  setPincodeFailure,
  setPincodeSuccess,
} from 'src/account/actions'
import { PincodeType, pincodeTypeSelector } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getCachedPincode, setCachedPincode } from 'src/pincode/PincodeCache'
// @ts-ignore TS doesn't understand the RN's platform specific file imports
import { getPinFromKeystore, setPinInKeystore } from 'src/pincode/PincodeUtils'
import Logger from 'src/utils/Logger'

const TAG = 'account/saga'

export function* setPincode({ pincodeType, pin }: SetPincodeAction) {
  try {
    if (pincodeType === PincodeType.PhoneAuth) {
      Logger.debug(TAG + '@setPincode', 'Setting pincode with using system auth')
      pin = randomBytes(10).toString('hex')
      yield call(setPinInKeystore, pin)
    } else if (pincodeType === PincodeType.CustomPin && pin) {
      Logger.debug(TAG + '@setPincode', 'Pincode set using user provided pin')
      setCachedPincode(pin)
    } else {
      throw new Error('Pincode type must be phone auth or must provide pin')
    }

    yield put(setPincodeSuccess(pincodeType))
    Logger.info(TAG + '@setPincode', 'Pincode set successfully')
  } catch (error) {
    Logger.error(TAG + '@setPincode', 'Failed to set pincode', error)
    yield put(showError(ErrorMessages.SET_PIN_FAILED))
    yield put(setPincodeFailure())
  }
}

export function* getPincode() {
  const pincodeType = yield select(pincodeTypeSelector)

  if (pincodeType === PincodeType.Unset) {
    Logger.error(TAG + '@getPincode', 'Pin has never been set')
    throw Error('Pin has never been set')
  }

  if (pincodeType === PincodeType.PhoneAuth) {
    Logger.debug(TAG + '@getPincode', 'Getting pin from keystore')
    const pin = yield call(getPinFromKeystore)
    if (!pin) {
      throw new Error('Keystore returned empty pin')
    }
    return pin
  }

  if (pincodeType === PincodeType.CustomPin) {
    Logger.debug(TAG + '@getPincode', 'Getting custom pin')
    const cachedPin = getCachedPincode()
    if (cachedPin) {
      return cachedPin
    }

    const pincodeEntered = new Promise((resolve, reject) => {
      navigate(Screens.PincodeConfirmation, { resolve, reject })
    })
    const pin = yield pincodeEntered
    if (!pin) {
      throw new Error('Pincode confirmation returned empty pin')
    }
    setCachedPincode(pin)
    return pin
  }
}

export function* accountSaga() {
  yield takeLeading(Actions.SET_PINCODE, setPincode)
}
