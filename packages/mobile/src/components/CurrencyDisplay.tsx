import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface Props {
  // TODO: Should be Bignumber
  amount: string | null | number
  size: number
  type: CURRENCY_ENUM
}

const symbolRatio = 0.6

export default class CurrencyDisplay extends React.PureComponent<Props> {
  color() {
    return this.props.type === CURRENCY_ENUM.DOLLAR ? colors.celoGreen : colors.celoGold
  }

  symbolStyle(fontSize: number) {
    const size = Math.floor(fontSize * symbolRatio)
    return {
      fontSize: size,
      color: this.color(),
      lineHeight: Math.round(size * 1.4),
      transform: [{ translateY: Math.round(size * 0.1) }],
    }
  }
  amount() {
    return this.props.amount == null ? '0.00' : getMoneyDisplayValue(this.props.amount || 0)
  }

  render() {
    const { size, type } = this.props
    const fontSize = size
    const dollarStyle = { fontSize, lineHeight: Math.round(fontSize * 1.3), color: this.color() }
    const currencySymbol = CURRENCIES[type].symbol
    return (
      <View style={styles.container}>
        <Text numberOfLines={1} style={[fontStyles.regular, this.symbolStyle(fontSize)]}>
          {currencySymbol}
        </Text>
        <Text numberOfLines={1} style={[styles.currency, fontStyles.regular, dollarStyle]}>
          {this.amount()}
        </Text>
      </View>
    )
  }
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
