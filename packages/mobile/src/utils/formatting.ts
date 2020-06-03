import colors from '@celo/react-components/styles/colors'
import BigNumber from 'bignumber.js'
import { CURRENCIES, CURRENCY_ENUM, WEI_PER_CELO } from 'src/geth/consts'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'

// Returns a localized string that represents the number with the right decimal points.
export const getMoneyDisplayValue = (
  value: BigNumber.Value,
  currency: CURRENCY_ENUM = CURRENCY_ENUM.DOLLAR,
  includeSymbol: boolean = false,
  roundingTolerance: number = 1
): string => {
  const decimals = CURRENCIES[currency].displayDecimals
  const symbol = CURRENCIES[currency].symbol
  const formattedValue = roundDown(value, decimals, roundingTolerance).toFormat(decimals)
  return includeSymbol ? symbol + formattedValue : formattedValue
}

export const getLocalCurrencyDisplayValue = (
  value: BigNumber.Value,
  currency: LocalCurrencyCode,
  includeSymbol: boolean = false,
  roundingTolerance: number = 1
): string => {
  const symbol = LocalCurrencySymbol[currency]
  const formattedValue = roundDown(value, 2, roundingTolerance).toFormat(2)
  return includeSymbol ? symbol + formattedValue : formattedValue
}

// like getMoneyDisplayValue but only returns cents if they are significant
export const getCentAwareMoneyDisplay = (value: BigNumber.Value): string => {
  const bigValue = new BigNumber(value)
  return bigValue.isInteger() ? bigValue.toFixed(0) : roundDown(value).toFormat(2)
}

export const getExchangeRateDisplayValue = (value: BigNumber.Value): string => {
  return new BigNumber(value).decimalPlaces(4).toFormat()
}

export const getFeeDisplayValue = (value: BigNumber.Value | null | undefined): string => {
  return value
    ? BigNumber.max(value, 0.001)
        .decimalPlaces(4)
        .toFormat()
    : ''
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
    return `<${new BigNumber(0.000001).toFormat()}`
  } else if (roundedNumber.isLessThan(0.001)) {
    return precise ? roundUp(value, 6).toFormat() : `<${new BigNumber(0.001).toFormat()}`
  } else {
    return roundUp(value, 3).toFormat()
  }
}

export const divideByWei = (value: BigNumber.Value, decimals?: number) => {
  const bn = new BigNumber(value).div(WEI_PER_CELO)
  return decimals ? bn.decimalPlaces(decimals) : bn
}

export const multiplyByWei = (value: BigNumber.Value, decimals?: number) => {
  const bn = new BigNumber(value).times(WEI_PER_CELO)
  return decimals ? bn.decimalPlaces(decimals) : bn
}

export function roundDown(
  value: BigNumber.Value,
  decimals: number = 2,
  roundingTolerance: number = 0
): BigNumber {
  if (roundingTolerance) {
    value = new BigNumber(value).decimalPlaces(
      decimals + roundingTolerance,
      BigNumber.ROUND_HALF_DOWN
    )
  }
  return new BigNumber(value).decimalPlaces(decimals, BigNumber.ROUND_DOWN)
}

export function roundUp(
  value: BigNumber.Value,
  decimals: number = 2,
  roundingTolerance: number = 0
): BigNumber {
  if (roundingTolerance) {
    value = new BigNumber(value).decimalPlaces(
      decimals + roundingTolerance,
      BigNumber.ROUND_HALF_DOWN
    )
  }
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
