import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { getCentAwareMoneyDisplay } from 'src/utils/formatting'

interface Props {
  amount: string
}

export default class NotificationAmount extends React.PureComponent<Props> {
  render() {
    return (
      <View>
        <Text style={[fontStyles.bodySmallSemiBold, styles.amount]}>
          ${getCentAwareMoneyDisplay(this.props.amount)}
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
