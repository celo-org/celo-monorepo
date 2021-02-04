import { RAMP_URI, SIMPLEX_URI, VALORA_LOGO_URL } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

export const openMoonpay = (currencyCode: LocalCurrencyCode, currencyToBuy: CURRENCY_ENUM) => {
  navigate(Screens.MoonPay, {
    localAmount: 0,
    currencyCode,
    currencyToBuy,
  })
}

export const openSimplex = (account: string | null) => {
  navigateToURI(`${SIMPLEX_URI}?address=${account}`)
}

export const openRamp = (currencyCode: LocalCurrencyCode, currencyToBuy: CURRENCY_ENUM) => {
  navigate(Screens.Ramp, {
    localAmount: 0,
    currencyCode,
    currencyToBuy,
  })
}
