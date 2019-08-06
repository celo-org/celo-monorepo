import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CURRENCIES, STABLE_CURRENCY } from 'src/geth/consts'
import { getCentAwareMoneyDisplay } from 'src/utils/formatting'

interface Props {
  amount: string
}

export default class NotificationAmount extends React.PureComponent<Props> {
  render() {
    const stableCurrencySymbol = CURRENCIES[STABLE_CURRENCY].symbol
    return (
      <View>
        <Text style={[fontStyles.bodySmallSemiBold, styles.amount]}>
          {stableCurrencySymbol + getCentAwareMoneyDisplay(this.props.amount)}
        </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  amount: {
    color: colors.darkSecondary,
  },
})
