import { takeLeading } from 'redux-saga/effects'
import { Actions, SetPincodeAction } from 'src/account/actions'
// import { randomBytes } from 'react-native-randombytes'

export function* setPincode({ useSystemAuth, pin }: SetPincodeAction) {
  // const pin = randomBytes(10).toString('hex')
  // let success
  // if (state.account.pincodeSet) {
  //   Logger.debug(TAG + '@setPin', 'Pincode has already been set')
  //   throw Error('Can not set PIN twice')
  // }
  // if (!pin) {
  //   Logger.debug(TAG + '@setPin', 'setpin got falsy pin: ' + pin)
  //   throw Error('Can not set falsy PIN')
  // }
  // if (SUPPORTS_KEYSTORE) {
  //   Logger.info(TAG + '@setPin', 'supports keystore')
  //   try {
  //     success = await setPinCred(pin)
  //   } catch (e) {
  //     Logger.debug(TAG + '@setPin', 'setpin failed with:' + e)
  //     success = false
  //   }
  //   Logger.info(TAG + '@setPin', 'keystore setpin: ' + success)
  // }
  // if (success) {
  //   await dispatch(pincodeSet())
  //   Logger.info(TAG + '@setPin', 'pincode set')
  //   return true
  // } else {
  //   dispatch(showError(ErrorMessages.SET_PIN_FAILED))
  //   return false
  // }
}

export function* accountSaga() {
  yield takeLeading(Actions.SET_PINCODE, setPincode)
}
