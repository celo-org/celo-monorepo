import { randomBytes } from 'react-native-randombytes'
import { call, put, select, takeLeading } from 'redux-saga/effects'
import {
  Actions,
  SetPincodeAction,
  setPincodeFailure,
  setPincodeSuccess,
} from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getPinFromKeystore, setPinInKeystore } from 'src/pincode/PhoneAuthUtils'
import { getCachedPincode, setCachedPincode } from 'src/pincode/PincodeCache'
import Logger from 'src/utils/Logger'

const TAG = 'account/saga'

export function* setPincode({ pincodeType, pin }: SetPincodeAction) {
  try {
    if (pincodeType === PincodeType.PhoneAuth) {
      Logger.debug(TAG + '@setPincode', 'Setting pincode with using system auth')
      pin = randomBytes(10).toString('hex') as string
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

export function* getPincode(withVerification = true) {
  const pincodeType = yield select(pincodeTypeSelector)

  if (pincodeType === PincodeType.Unset) {
    Logger.error(TAG + '@getPincode', 'Pin has never been set')
    throw Error('Pin has never been set')
  }

  // This method is deprecated and will be removed soon
  // `withVerification` is ignored here (it will NOT verify PIN)
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

    const pin = yield new Promise((resolve, reject) => {
      navigate(Screens.PincodeEnter, {
        onSuccess: resolve,
        onFail: reject,
        withVerification,
      })
    })

    navigateBack()

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
