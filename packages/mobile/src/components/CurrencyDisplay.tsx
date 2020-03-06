import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import { useExchangeRate as useGoldToDollarRate } from 'src/exchange/hooks'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import {
  useExchangeRate as useDollarToLocalRate,
  useLocalCurrencyCode,
} from 'src/localCurrency/hooks'
import { goldToDollarAmount } from 'src/utils/currencyExchange'
import { getMoneyDisplayValue, getNetworkFeeDisplayValue } from 'src/utils/formatting'

export enum DisplayType {
  Default,
  Big, // symbol displayed as superscript
}

export enum FormatType {
  Default,
  NetworkFee,
  NetworkFeePrecise,
}

interface Props {
  type: DisplayType
  amount: MoneyAmount
  size: number // only used for DisplayType.Big
  useColors: boolean
  hideSymbol: boolean
  showLocalAmount?: boolean
  formatType: FormatType
  style?: StyleProp<TextStyle>
}

const SYMBOL_RATIO = 0.6

function getBigSymbolStyle(fontSize: number, color: string | undefined) {
  const size = Math.floor(fontSize * SYMBOL_RATIO)
  return {
    fontSize: size,
    color,
    lineHeight: Math.round(size * 1.4),
    transform: [{ translateY: Math.round(size * 0.1) }],
  }
}

function getLocalAmount(
  amount: MoneyAmount,
  localCurrencyCode: LocalCurrencyCode,
  dollarToLocalRate: BigNumber.Value | null | undefined,
  goldToDollarRate: BigNumber
) {
  if (amount.localAmount) {
    return amount.localAmount
  }

  let dollarValue = null
  if (amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code) {
    dollarValue = goldToDollarAmount(amount.value, goldToDollarRate)
  } else if (amount.currencyCode === CURRENCIES[CURRENCY_ENUM.DOLLAR].code) {
    dollarValue = amount.value
  } else {
    // Can't convert other currencies for now
    return null
  }

  const localValue = convertDollarsToLocalAmount(dollarValue, dollarToLocalRate)
  if (!localValue) {
    return null
  }

  return {
    value: localValue,
    currencyCode: localCurrencyCode as string,
  }
}

type FormatFunction = (amount: BigNumber.Value, currency?: CURRENCY_ENUM) => string

function getFormatFunction(formatType: FormatType): FormatFunction {
  switch (formatType) {
    case FormatType.Default:
      return getMoneyDisplayValue
    case FormatType.NetworkFee:
      return (amount: BigNumber.Value, currency?: CURRENCY_ENUM) =>
        getNetworkFeeDisplayValue(amount)
    case FormatType.NetworkFeePrecise:
      return (amount: BigNumber.Value, currency?: CURRENCY_ENUM) =>
        getNetworkFeeDisplayValue(amount, true)
  }
}

// TODO(Rossy) This is mostly duped by MoneyAmount, converge the two
export default function CurrencyDisplay({
  type,
  size,
  useColors,
  hideSymbol,
  showLocalAmount,
  amount,
  formatType,
  style,
}: Props) {
  const localCurrencyCode = useLocalCurrencyCode()
  const dollarToLocalRate = useDollarToLocalRate()
  const goldToDollarRate = useGoldToDollarRate()

  const currency =
    amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
      ? CURRENCY_ENUM.GOLD
      : CURRENCY_ENUM.DOLLAR

  // Show local amount only if explicitly set to true when currency is gold
  const shouldShowLocalAmount = showLocalAmount ?? currency !== CURRENCY_ENUM.GOLD
  const displayAmount = shouldShowLocalAmount
    ? getLocalAmount(amount, localCurrencyCode, dollarToLocalRate, goldToDollarRate)
    : amount
  const displayCurrency = displayAmount
    ? displayAmount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
      ? CURRENCY_ENUM.GOLD
      : CURRENCY_ENUM.DOLLAR
    : null
  const currencySymbol = displayAmount
    ? shouldShowLocalAmount
      ? LocalCurrencySymbol[displayAmount.currencyCode as LocalCurrencyCode]
      : CURRENCIES[currency].symbol
    : null
  const value = displayAmount ? new BigNumber(displayAmount.value) : null
  const sign = value?.isNegative() ? '-' : ''
  const formatAmount = getFormatFunction(formatType)
  const formattedValue =
    value && displayCurrency ? formatAmount(value.absoluteValue(), displayCurrency) : '-'

  const color = useColors
    ? currency === CURRENCY_ENUM.GOLD
      ? colors.celoGold
      : colors.celoGreen
    : StyleSheet.flatten(style)?.color

  if (type === DisplayType.Big) {
    // In this type the symbol is displayed as superscript
    // the downside is we have to workaround React Native not supporting it
    // and have to involve a View, which prevents this type to be embedded into a Text node
    // see https://medium.com/@aaronmgdr/a-better-superscript-in-react-native-591b83db6caa
    const fontSize = size
    const symbolStyle = getBigSymbolStyle(fontSize, color)
    const amountStyle = { fontSize, lineHeight: Math.round(fontSize * 1.3), color }

    return (
      <View style={[styles.bigContainer, style]}>
        {!hideSymbol && (
          <Text numberOfLines={1} style={[fontStyles.regular, symbolStyle]}>
            {currencySymbol}
          </Text>
        )}
        <Text numberOfLines={1} style={[fontStyles.regular, styles.bigCurrency, amountStyle]}>
          {formattedValue}
        </Text>
      </View>
    )
  }

  return (
    <Text numberOfLines={1} style={[{ color }, style]}>
      {sign}
      {!hideSymbol && currencySymbol}
      {formattedValue}
    </Text>
  )
}

CurrencyDisplay.defaultProps = {
  type: DisplayType.Default,
  size: 48,
  useColors: false,
  hideSymbol: false,
  formatType: FormatType.Default,
}

const styles = StyleSheet.create({
  bigContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  bigCurrency: {
    paddingHorizontal: 3,
  },
})
