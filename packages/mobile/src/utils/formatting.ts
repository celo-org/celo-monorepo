import colors from '@celo/react-components/styles/colors'
import BigNumber from 'bignumber.js'
import { CURRENCIES, CURRENCY_ENUM, WEI_PER_CELO } from 'src/geth/consts'

const numeral = require('numeral')

// Returns a localized string that represents the number with the right decimal points.
// The input value is parsed without consideration for the current numeral locale, i.e. it uses `.` for the decimal separator as JS usually does
export const getMoneyDisplayValue = (
  value: BigNumber.Value,
  currency: CURRENCY_ENUM = CURRENCY_ENUM.DOLLAR,
  includeSymbol: boolean = false
): string => {
  const decimals = CURRENCIES[currency].displayDecimals
  const symbol = CURRENCIES[currency].symbol
  const formattedValue = numeral(roundDown(value, decimals).toNumber()).format(
    '0,0.' + '0'.repeat(decimals)
  )
  return includeSymbol ? symbol + formattedValue : formattedValue
}

// like getMoneyDisplayValue but only returns cents if they are sigificant
export const getCentAwareMoneyDisplay = (value: BigNumber.Value): string => {
  return numeral(roundDown(value).toNumber()).format('0,0[.]00')
}

export const getExchangeRateDisplayValue = (value: BigNumber): string => {
  return numeral(value.toNumber()).format('0[.][0000]')
}

export const getFeeDisplayValue = (value: BigNumber.Value | null | undefined): string => {
  return value ? numeral(BigNumber.max(value, 0.001).toNumber()).format('0[.][0000]') : ''
}

/**
 * More precise getFeeDisplayValue with built in rounding
 * Used for small Network Fees
 * @param value fee amount
 * @param precise true if additional precision to 6 digits for <0.001 needed
 */
export const getNetworkFeeDisplayValue = (
  value: BigNumber.Value,
  precise: boolean = false
): string => {
  const roundedNumber = new BigNumber(value)
  if (precise && roundedNumber.isLessThan(0.000001)) {
    return '<0.000001'
  } else if (roundedNumber.isLessThan(0.001)) {
    return precise ? numeral(roundUp(value, 6).toNumber()).format('0[.][000000]') : '<0.001'
  } else {
    return numeral(roundUp(value, 3).toNumber()).format('0[.][000]')
  }
}

export const divideByWei = (value: BigNumber.Value, decimals?: number) => {
  const bn = new BigNumber(value).div(WEI_PER_CELO)
  return decimals ? bn.decimalPlaces(decimals) : bn
}

export function roundDown(value: BigNumber.Value, decimals: number = 2): BigNumber {
  return new BigNumber(value).decimalPlaces(decimals, BigNumber.ROUND_DOWN)
}

export function roundUp(value: BigNumber.Value, decimals: number = 2): BigNumber {
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

export const getBalanceColor = (accountBalance: BigNumber): string => {
  if (accountBalance.isGreaterThan(0)) {
    return colors.celoGreen
  }
  if (accountBalance.isLessThan(0)) {
    return colors.errorRed
  }
  return colors.dark
}
