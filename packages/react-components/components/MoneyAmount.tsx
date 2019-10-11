import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  amount: string
  symbol?: string
  sign?: string
  color?: string
  code?: string
}

// TODO(Rossy) This is mostly duped by CurrencyDisplay, converge the two
export function MoneyAmount(props: Props) {
  const { sign, symbol, amount, color, code } = props
  const colorStyle = { color: color || colors.darkSecondary }
  return (
    <View style={style.container}>
      {!!sign && <Text style={[style.plusSign, colorStyle]}>{sign}</Text>}
      {!!symbol && <Text style={[style.currencySymbol, colorStyle]}>{symbol}</Text>}
      <Text style={[style.amount, colorStyle]} numberOfLines={1} ellipsizeMode="tail">
        {amount}
      </Text>
      {!!code && <Text style={style.currencyCode}>{code}</Text>}
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 25,
    marginTop: 15,
    alignSelf: 'center',
  },
  amount: {
    ...fontStyles.regular,
    fontSize: 48,
    lineHeight: 64,
    color: colors.darkSecondary,
  },
  plusSign: {
    ...fontStyles.regular,
    fontSize: 34,
  },
  currencySymbol: {
    ...fontStyles.regular,
    textAlignVertical: 'top',
    fontSize: 24,
    color: colors.darkSecondary,
  },
  currencyCode: {
    ...fontStyles.body,
    lineHeight: 64,
    color: colors.lightGray,
    marginLeft: 7,
    alignSelf: 'flex-end',
  },
})
