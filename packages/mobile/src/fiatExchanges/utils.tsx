import { SIMPLEX_URI } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

export const openMoonpay = (currencyCode: LocalCurrencyCode, currencyToBuy: CURRENCY_ENUM) => {
  navigate(Screens.MoonPayScreen, {
    localAmount: 0,
    currencyCode,
    currencyToBuy,
  })
}

export const openSimplex = (account: string | null) => {
  navigateToURI(`${SIMPLEX_URI}?address=${account}`)
}

export const openRamp = (currencyCode: LocalCurrencyCode, currencyToBuy: CURRENCY_ENUM) => {
  navigate(Screens.RampScreen, {
    localAmount: 0,
    currencyCode,
    currencyToBuy,
  })
}

export const openTransak = (currencyCode: LocalCurrencyCode, currencyToBuy: CURRENCY_ENUM) => {
  navigate(Screens.TransakScreen, {
    localAmount: 0,
    currencyCode,
    currencyToBuy,
  })
}
