import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { useDollarsToLocalAmount, useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { getMoneyDisplayValue } from 'src/utils/formatting'

export enum DisplayType {
  Default,
  Big, // symbol displayed as superscript
}

interface Props {
  type: DisplayType
  amount: MoneyAmount
  size: number // only used for DisplayType.Big
  useColors: boolean
  hideSymbol: boolean
  formatAmount: (amount: BigNumber.Value) => string
  style?: StyleProp<TextStyle>
}

const SYMBOL_RATIO = 0.6

function getBigSymbolStyle(fontSize: number, color: string) {
  const size = Math.floor(fontSize * SYMBOL_RATIO)
  return {
    fontSize: size,
    color,
    lineHeight: Math.round(size * 1.4),
    transform: [{ translateY: Math.round(size * 0.1) }],
  }
}

// TODO(Rossy) This is mostly duped by MoneyAmount, converge the two
export default function CurrencyDisplay({
  type,
  size,
  useColors,
  hideSymbol,
  amount,
  formatAmount,
  style,
}: Props) {
  const localCurrencyCode = useLocalCurrencyCode()
  // tslint:disable-next-line: react-hooks-nesting
  const localValue = useDollarsToLocalAmount(amount.value) || 0

  const currency =
    amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
      ? CURRENCY_ENUM.GOLD
      : CURRENCY_ENUM.DOLLAR

  // For now only show the local amount when original currency is dollars
  const localAmount =
    currency === CURRENCY_ENUM.DOLLAR && localCurrencyCode
      ? amount.localAmount ?? { value: localValue, currencyCode: localCurrencyCode }
      : null
  const displayAmount = localAmount ?? amount
  const currencySymbol =
    displayAmount === localAmount
      ? LocalCurrencySymbol[displayAmount.currencyCode as LocalCurrencyCode]
      : CURRENCIES[currency].symbol
  const value = new BigNumber(displayAmount.value)
  const sign = value.isNegative() ? '-' : ''
  const formattedValue = formatAmount(value.absoluteValue())

  const color = useColors
    ? currency === CURRENCY_ENUM.GOLD
      ? colors.celoGold
      : colors.celoGreen
    : colors.darkSecondary

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
  useColors: true,
  hideSymbol: false,
  formatAmount: (amount: BigNumber.Value) => getMoneyDisplayValue(amount),
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
