import colors from '@celo/react-components/styles/colors'
import BigNumber from 'bignumber.js'
import { CURRENCY_ENUM, WEI_PER_JEM } from 'src/geth/consts'
const numeral = require('numeral')

// Returns a localized string that represents the number with two decimal points. The input value is parsed without consideration for the current numeral locale, i.e. it uses `.` for the decimal separator as JS usually does
export const getMoneyDisplayValue = (value: number | string | BigNumber, decimals: number = 2) => {
  return numeral(roundedDownNumber(value, decimals)).format('0,0.' + '0'.repeat(decimals))
}

// like getMoneyDisplayValue but only returns cents if they are sigificant
export const getCentAwareMoneyDisplay = (value: number | string | BigNumber) => {
  return numeral(roundedDownNumber(value)).format('0,0[.]00')
}

// Returns a localized string that represents the number with four decimal points
export const getMoneyFeeyDisplayValueFromBigNum = (value: BigNumber) => {
  return roundedUpNumber(value, 4).toString()
}

export const getExchangeDisplayValueFromBigNum = (value: BigNumber) => {
  return numeral(value.toNumber()).format('0[.][0000]')
}

export const divideByWei = (value: number | string, decimals: number = 2) => {
  const bn = new BigNumber(value)
  return bn
    .div(WEI_PER_JEM)
    .decimalPlaces(decimals)
    .valueOf()
}

export function roundedDownNumber(value: BigNumber.Value, decimals: number = 2) {
  return new BigNumber(value).decimalPlaces(decimals, BigNumber.ROUND_DOWN)
}

export function roundedUpNumber(value: BigNumber.Value, decimals: number = 2) {
  return new BigNumber(value).decimalPlaces(decimals, BigNumber.ROUND_UP)
}

export const getCurrencyColor = (currencyType: CURRENCY_ENUM): string => {
  switch (currencyType) {
    case CURRENCY_ENUM.DOLLAR:
      return colors.celoGreen
    case CURRENCY_ENUM.GOLD:
      return colors.celoGold
  }
}
