import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import CeloAccountIcon from 'src/icons/CeloAccountIcon'
import { getCentAwareMoneyDisplay } from 'src/utils/formatting'

const { contentPadding } = variables

interface Props {
  dollarBalance: BigNumber | string | null
}

class PaymentRequestBalance extends React.PureComponent<Props & WithNamespaces> {
  render() {
    return (
      <View style={styles.balanceContainer}>
        <CeloAccountIcon />
        <View style={styles.balance}>
          <Text style={fontStyles.bodySmallSemiBold}>{this.props.t('celoDollarBalance')}</Text>
          <Text style={[fontStyles.bodySmallSemiBold, componentStyles.colorGreen]}>
            ${getCentAwareMoneyDisplay(this.props.dollarBalance || 0)}
          </Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: contentPadding,
    flex: 0,
  },
  balance: {
    paddingStart: contentPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
})
export default withNamespaces(Namespaces.paymentRequestFlow)(PaymentRequestBalance)
