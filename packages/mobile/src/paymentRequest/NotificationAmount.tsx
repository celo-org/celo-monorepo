import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { divideByWei, getCentAwareMoneyDisplay } from 'src/utils/formatting'

interface Props {
  amount: BigNumber.Value
}

export default class NotificationAmount extends React.PureComponent<Props> {
  render() {
    return (
      <View>
        <Text style={[fontStyles.bodySmallSemiBold, styles.amount]}>
          {CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol +
            getCentAwareMoneyDisplay(divideByWei(this.props.amount))}
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
