import { randomBytes } from 'react-native-randombytes'
import { call, put, select, takeLatest, takeLeading } from 'redux-saga/effects'
import {
  Actions,
  setMoonpayUrl,
  SetPincodeAction,
  setPincodeFailure,
  setPincodeSuccess,
} from 'src/account/actions'
import { PincodeType, pincodeTypeSelector } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Actions as LocalCurrencyActions } from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getCachedPincode, setCachedPincode } from 'src/pincode/PincodeCache'
import { getPinFromKeystore, setPinInKeystore } from 'src/pincode/PincodeUtils'
import Logger from 'src/utils/Logger'
import { Actions as Web3Actions } from 'src/web3/actions'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'account/saga'

const moonpayUri = 'https://buy-staging.moonpay.io/'
const apiKey = 'pk_test_EDT0SRJUlsJezJUFGaVZIr8LuaTsF5NO' // (publishable) TODO production api key when cUSD added to Moonpay
const celoCurrencyCode = 'ETH' // TODO switch to cUSD when added to Moonpay
const moonpaySupportedCurrencies = ['USD', 'EUR', 'GBP']

const moonpayBuyUrl = moonpayUri + '?apiKey=' + apiKey + '&currencyCode=' + celoCurrencyCode

export function* updateMoonpayUrl() {
  const currencyCode: LocalCurrencyCode = yield select(getLocalCurrencyCode)
  const account = yield select(currentAccountSelector)
  const moonpayCurrencyCode = moonpaySupportedCurrencies.includes(currencyCode)
    ? currencyCode
    : LocalCurrencyCode.USD // Default to USD if fiat currency not supported by Moonpay
  const url =
    moonpayBuyUrl + '&walletAddress=' + account + '&baseCurrencyCode=' + moonpayCurrencyCode
  yield put(setMoonpayUrl(url))
}

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

export function* getPincode(useCache = true) {
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
    if (useCache) {
      const cachedPin = getCachedPincode()
      if (cachedPin) {
        return cachedPin
      }
    }

    const pincodeEntered = new Promise((resolve, reject) => {
      navigate(Screens.PincodeConfirmation, { resolve, reject })
    })
    const pin = yield pincodeEntered
    if (!pin) {
      throw new Error('Pincode confirmation returned empty pin')
    }
    if (useCache) {
      setCachedPincode(pin)
    }
    return pin
  }
}

export default function* moonpayUrlSaga() {
  // Update Moonpay URL whenever local currency or current account change
  yield takeLatest(
    [LocalCurrencyActions.SELECT_PREFERRED_CURRENCY, Web3Actions.SET_ACCOUNT],
    updateMoonpayUrl
  )
}

export function* accountSaga() {
  yield takeLeading(Actions.SET_PINCODE, setPincode)
}
