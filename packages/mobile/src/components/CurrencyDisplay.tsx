import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { useDollarsToLocalAmount, useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface Props {
  amount: MoneyAmount
  size: number
  useColors: boolean
  formatAmount: (amount: BigNumber.Value) => string
}

const SYMBOL_RATIO = 0.6

function getSymbolStyle(fontSize: number, color: string) {
  const size = Math.floor(fontSize * SYMBOL_RATIO)
  return {
    fontSize: size,
    color,
    lineHeight: Math.round(size * 1.4),
    transform: [{ translateY: Math.round(size * 0.1) }],
  }
}

// TODO(Rossy) This is mostly duped by MoneyAmount, converge the two
export default function CurrencyDisplay({ size, useColors, amount, formatAmount }: Props) {
  const localCurrencyCode = useLocalCurrencyCode()
  // tslint:disable-next-line: react-hooks-nesting
  const localValue = useDollarsToLocalAmount(amount.amount) || 0

  const type =
    amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
      ? CURRENCY_ENUM.GOLD
      : CURRENCY_ENUM.DOLLAR
  const color = useColors
    ? type === CURRENCY_ENUM.GOLD
      ? colors.celoGold
      : colors.celoGreen
    : colors.darkSecondary
  const fontSize = size
  const symbolStyle = getSymbolStyle(fontSize, color)
  const amountStyle = { fontSize, lineHeight: Math.round(fontSize * 1.3), color }

  // For now only show the local amount when original currency is dollars
  const localAmount =
    type === CURRENCY_ENUM.DOLLAR && localCurrencyCode
      ? amount.localAmount ?? { amount: localValue, currencyCode: localCurrencyCode }
      : null
  const displayAmount = localAmount ?? amount
  const currencySymbol =
    displayAmount === amount.localAmount
      ? LocalCurrencySymbol[displayAmount.currencyCode as LocalCurrencyCode]
      : CURRENCIES[type].symbol

  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={[fontStyles.regular, symbolStyle]}>
        {currencySymbol}
      </Text>
      <Text numberOfLines={1} style={[styles.currency, fontStyles.regular, amountStyle]}>
        {formatAmount(displayAmount.amount)}
      </Text>
    </View>
  )
}

CurrencyDisplay.defaultProps = {
  size: 48,
  useColors: true,
  formatAmount: (amount: BigNumber.Value) => getMoneyDisplayValue(amount),
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  currency: {
    paddingHorizontal: 3,
  },
})
